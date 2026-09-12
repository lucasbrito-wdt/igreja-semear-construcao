---
type: security-audit
date: 2026-09-12
scope: front (Next.js 16.3.4 / Vercel) — proxy /api/doacoes, BotID, headers, fluxo /doar, validação, deps, LGPD
status: open
auditor: security-auditor (somente leitura)
out-of-scope: API Laravel (auditoria posterior), design/prototype
---

# Auditoria de segurança — front (campanha-terreno)

## Sumário executivo

O fluxo de cartão transparente está bem cuidado no que mais importa: número e CVV não são logados nem persistidos em
nenhum ponto do client ou do server; o token de proxy não vaza para o bundle (verificado com build real e sentinela);
o id do status é validado como UUID (sem SSRF); erros 5xx do POST não ecoam o corpo da API; `pnpm audit` está limpo.

O ponto fraco principal é a **ausência total de headers de segurança** (CSP, HSTS, frame-ancestors etc.) numa página
que coleta PAN/CVV: nada impede clickjacking do formulário e não existe barreira contra script injetado (skimming
estilo Magecart). Na sequência vêm:

- comportamento fail-open quando falta env ou ela está insegura;
- repasse cru de status/corpo no proxy de status;
- BotID em modo Basic sem rate limit de borda;
- polling de Pix sem teto, com risco de loop infinito no Safari;
- risco de cobrança duplicada por timeout seguido de retry, sem idempotency key;
- consentimento LGPD pré-marcado e misturado com comunicação.

| Severidade | Qtde |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 6 |
| Low | 13 |
| Info | 5 |

Metodologia: leitura de todo o escopo, `pnpm audit --prod` e `pnpm audit` (0 vulnerabilidades), `pnpm build` com
`CAMPAIGN_PROXY_TOKEN=SENTINELA_TOKEN_XYZ123` seguido de grep em `.next/static` e `.next/server` pela sentinela e pelos
nomes `CAMPAIGN_PROXY_TOKEN`, `X-Proxy-Token`, `API_URL`, `CAMPAIGN_SLUG`, `localhost:8000` (0 ocorrências), leitura do
código-fonte de `botid@1.5.11` (`dist/next/config`, `dist/server`, `dist/client/core`), `security_scan.py`.

---

## Achados

| ID | Sev. | Local | Problema | Correção proposta |
|---|---|---|---|---|
| H-01 | High | `next.config.ts:4-8` | Nenhum header de segurança. Sem CSP, HSTS explícito, `frame-ancestors`/`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. A página `/doar` coleta PAN/CVV/CPF: pode ser embutida em iframe (clickjacking/overlay) e não há contenção de script injetado. Único header hoje é o que o `withBotId` aplica ao próprio path do BotID. | Config exata na seção "Headers propostos". Rollout em `Content-Security-Policy-Report-Only` no preview, validar fluxo completo (BotID + submit cartão/Pix/boleto), depois enforce. |
| M-01 | Medium | `src/app/api/doacoes/route.ts:37`, `src/lib/api/upstream.ts:5-7` | Fail-open com env ausente ou insegura: sem `CAMPAIGN_PROXY_TOKEN` o proxy envia `X-Proxy-Token: ""` junto com o payload de cartão; se na Laravel `config('campanha.proxy_token')` também estiver vazio, `hash_equals("", "")` é `true` e a proteção some. `API_URL` não é validada (um `http://` em produção trafega PAN em claro na internet, violando PCI DSS 4.2.1). `CAMPAIGN_SLUG` ausente vira `/campanhas/undefined`. | Validar config uma vez e falhar fechado **antes** de ler/encaminhar o body. Ver snippet S-1. Na Laravel (auditoria posterior): rejeitar quando o token configurado for vazio ou curto. |
| M-02 | Medium | `src/app/api/doacoes/[id]/status/route.ts:23-28` | O proxy de status repassa **qualquer** status e corpo do upstream (500 com `message`/`exception`/`trace` se `APP_DEBUG=true`, 404 com nome de model do Laravel etc.). O fetch não tem timeout: se a Laravel/Asaas travar, a função fica presa até o `maxDuration` da Vercel, e o polling multiplica isso. | Allowlist de status (`200`, `404`, `429`) e reprojeção do corpo 200 para `{ id, status, pago }` via zod. Qualquer outro status vira 502 genérico. `signal: AbortSignal.timeout(8_000)`. Ver snippet S-2. |
| M-03 | Medium | `src/instrumentation-client.ts:3-5`, `src/app/api/doacoes/route.ts:23` | BotID configurado corretamente (path/method batem: `^/api/doacoes$` + `POST`, e o client usa `fetch("/api/doacoes", { method: "POST" })`), mas no modo **Basic** (default), que é contornável por automação com browser real, cenário típico de card-testing. Não há rate limit na borda. O throttle da Laravel ("10/min por IP", spec-delta:42) só funciona se for chaveado por `X-Donor-Ip`: pelo IP de conexão ele vê os IPs de egress da Vercel, que são compartilhados por todos os doadores (bloqueia legítimos e não segura atacante). | 1) Se o plano permitir, usar Deep Analysis nos dois lados: `protect: [{ path: "/api/doacoes", method: "POST", advancedOptions: { checkLevel: "deepAnalysis" } }]` e `checkBotId({ advancedOptions: { checkLevel: "deepAnalysis" } })`. 2) Regra no Vercel Firewall: rate limit em `POST /api/doacoes` (ex.: 5 req/min por IP, ação deny 10 min). 3) Laravel: throttle por `X-Donor-Ip`, e só depois de validar o token (verificar na auditoria do backend). |
| M-04 | Medium | `src/components/doar/usePixPolling.ts:34-37, 49-50, 66-67` | Polling sem teto: roda a cada 4s enquanto `expirado` for falso. Se `expira_em` vier fora de ISO 8601 (ex.: `"2026-09-12 23:59:59"`, formato padrão do Laravel; o Safari devolve `Invalid Date`), `calcularRestante` vira `NaN`, `NaN <= 0` é `false` e o polling **nunca para** (auto-DoS da API, que por sua vez consulta o Asaas). Status terminais (400/404) também continuam em loop com backoff. O contrato (spec-delta:55) não fixa o formato de `expira_em`. | Fixar ISO 8601 com offset no contrato. No hook: `const ms = Date.parse(expiraEm); if (!Number.isFinite(ms))` mostra estado de erro/expirado e não faz polling. Teto de duração: `const fim = Math.min(ms, inicio + 30 * 60_000)`, mais um `MAX_TENTATIVAS` (ex.: 400). Parar em `response.status === 400 \|\| 404`. |
| M-05 | Medium | `src/components/doar/steps/DadosStep.tsx:67-74`, `src/components/doar/useDonationForm.ts:51` | LGPD: o checkbox vem **pré-marcado** (`recibo = true`) e mistura duas finalidades: recibo (base legal: execução/obrigação, não precisa de consentimento) e "relatório mensal da obra por e-mail" (comunicação recorrente, que precisa de consentimento livre e inequívoco, art. 8º; caixa pré-marcada não serve). Não há aviso ou link de política de privacidade no formulário que coleta CPF, e-mail e telefone (art. 9º; `grep privacidade\|lgpd` em `src` sem resultado). | Recibo sempre enviado (não opcional). Checkbox separado e **desmarcado** para "Quero receber o relatório mensal da obra". Linha abaixo do CTA: "Usamos seus dados apenas para processar a doação e emitir o recibo. [Política de privacidade]". Criar página `/privacidade` com controlador, finalidades, compartilhamento (Asaas), retenção e canal do titular. |
| M-06 | Medium | `src/app/api/doacoes/route.ts:6, 41, 51-54`, `src/components/doar/screens/TelaErroProvedor.tsx:30-39` | Risco de cobrança duplicada: se o Asaas demorar mais de 25s, o proxy aborta e responde 502, mas a Laravel pode ter concluído a cobrança. A tela de erro diz que "o problema foi na nossa conexão... Pode tentar novamente", o usuário redigita o cartão e é cobrado duas vezes. Não existe idempotency key no contrato (integridade, A08/A10). | O client gera `const idempotencyKey = crypto.randomUUID()` por intenção de doação (mantida entre retries da mesma tentativa e renovada em "Fazer outra doação") e envia `Idempotency-Key`. O proxy repassa só se casar com o regex UUID. A Laravel deduplica por chave (cache 24h) e devolve a resposta original. Opcional: o timeout do proxy deve ser menor que o `maxDuration` e maior que o timeout Laravel→Asaas. |
| L-01 | Low | `src/app/api/doacoes/route.ts:14-20` | Na Vercel, `x-forwarded-for` e `x-real-ip` são **sobrescritos pela borda** (a Vercel não repassa IP externo), então o primeiro IP do XFF é confiável **ali**. Fora da Vercel (`next start`, outro host, CDN na frente) o header é spoofável, e o `remoteIp` enviado ao antifraude do Asaas e a chave de throttle passam a ser controlados pelo atacante. Com Cloudflare proxy na frente da Vercel, o IP seria o da Cloudflare. O valor também não é validado como IP. | Usar a fonte canônica e validar: `import { ipAddress } from "@vercel/functions"` (lê `x-real-ip`; exige adicionar a dependência) ou, sem dependência, ler `x-real-ip` primeiro. Em ambos, `import { isIP } from "node:net"` e só enviar se `isIP(ip) !== 0`. Documentar que o deploy suportado é apenas Vercel sem proxy à frente. |
| L-02 | Low | `src/app/api/doacoes/route.ts:28, 40` | O proxy encaminha o body cru, sem checar `Content-Type`, tamanho ou forma. Campos extras chegam à Laravel (superfície de mass-assignment) e bodies grandes consomem a função. Hoje só a Laravel valida o input (CLAUDE.md: "Validate input at system boundaries"). | `if (!request.headers.get("content-type")?.startsWith("application/json")) return 415`; limitar `body.length <= 16_384` (senão 413); `JSON.parse` + schema zod `.strict()` do `ApiPayload` (strings com `max`, `cartao.numero` `^\d{12,19}$`, `cvv` `^\d{3,4}$`); reserializar o objeto validado. Em falha, 400 genérico **sem ecoar** o body. |
| L-03 | Low | `src/components/doar/screens/TelaBoleto.tsx:60` | `href={boleto.url}` vem da API sem validação. O React 19 bloqueia `javascript:`, mas `http:` ou um host arbitrário (API comprometida ou MITM entre Laravel e Asaas) viraria phishing aberto em nova aba. | `const url = safeBoletoUrl(boleto.url)`, com `new URL(u)`, `protocol === "https:"` e host terminando em `asaas.com` (inclui `sandbox.asaas.com`). Se falhar, esconder o botão e mostrar só a linha digitável. |
| L-04 | Low | `src/app/api/doacoes/route.ts:23-26` | `checkBotId()` fica fora do `try`. Sem OIDC, com o serviço BotID fora ou fora da Vercel, ele lança exceção e gera 500 não tratado com stack no log da Vercel. Continua fail-closed (não encaminha), o que está correto, mas a resposta sai sem controle e sem tag de log. | Envolver em `try { ... } catch (e) { console.error("[doacoes] botid falhou", upstreamErrorName(e)); return Response.json({ message: GENERIC_ERROR_MESSAGE }, { status: 503 }); }`, mantendo o fail-closed. |
| L-05 | Low | `src/app/api/doacoes/route.ts:44-50` | 403 e 429 do upstream são repassados sem log. Um 403 da Laravel significa token de proxy divergente (misconfig que derruba todas as doações) e fica invisível. No client, o 403 do BotID e o 403 do upstream também são indistinguíveis. | `if (upstreamResponse.status === 403 \|\| upstreamResponse.status === 429) console.warn("[doacoes] upstream", upstreamResponse.status);`, só com status e nunca com body. Opcional: header `X-Block-Reason: bot` no 403 do BotID. |
| L-06 | Low | `src/components/doar/steps/DadosStep.tsx:45-55, 93-104`; `src/components/doar/steps/PagamentoStep.tsx:98-108, 192-202` | Campos sensíveis sem `spellCheck={false}`. O Enhanced Spellcheck do Chrome e o Microsoft Editor do Edge enviam o conteúdo de inputs de texto a servidores de terceiros ("spell-jacking"): nome do titular, CPF, e-mail. | Adicionar `spellCheck={false} autoCorrect="off" autoCapitalize="off"` nos inputs de CPF/CNPJ, e-mail, titular, número, validade e CVV (e `autoCapitalize="words"` em nome, se desejado). |
| L-07 | Low | `src/components/doar/steps/PagamentoStep.tsx:170-173` | O texto "Dados enviados criptografados direto ao processador de pagamento" é **factualmente incorreto**: os dados passam pelo servidor do site (Vercel) e pela API Laravel antes do Asaas. Viola o princípio de transparência (LGPD art. 6º, VI). | "Seus dados de cartão trafegam criptografados (HTTPS) até o processador de pagamento (Asaas) e não são armazenados por nós. Guardamos apenas a bandeira e os 4 últimos dígitos." |
| L-08 | Low | `src/app/api/doacoes/route.ts:11, 25, 50` | As respostas do POST (id, Pix copia-e-cola, boleto) saem sem `Cache-Control: no-store`. POST não é cacheado pela CDN por padrão, mas é defesa em profundidade para caches intermediários e bfcache. | Passar `headers: { "Cache-Control": "no-store" }` nas três respostas (como já feito no status). |
| L-09 | Low | `next.config.ts:4` | Header `X-Powered-By: Next.js` exposto (fingerprinting). | `poweredByHeader: false` (incluído na config proposta). |
| L-10 | Low | deploy (Vercel) | Em preview o BotID executa de verdade (`NODE_ENV=production`), mas as URLs de preview são públicas. Se usarem o mesmo `API_URL`/`CAMPAIGN_PROXY_TOKEN` de produção, viram um segundo ponto de entrada para cobranças reais. Em `next dev`, `checkBotId` retorna HUMAN sempre (esperado). | Env por ambiente: Preview aponta para Laravel sandbox (Asaas sandbox) com token distinto. Ativar Vercel Deployment Protection (Standard) nos previews. |
| L-11 | Low | `.gitignore` | `test-results/`, `.scratch/` e `.vitest/` não são ignorados. Traces e screenshots do Playwright (`trace: on-first-retry`) capturam o formulário preenchido e podem ser commitados no primeiro `git add .` (hoje só há dados de teste). | Acrescentar `/test-results/`, `/playwright-report/`, `/blob-report/`, `/.scratch/`, `/.vitest/`. |
| L-12 | Low | `package.json:19` | `next@16.3.4`. A 16.3.5 (2026-09-11) inclui "Add CSP nonce to script tags of loading and template files (#98403)", pré-requisito se for adotada CSP com nonce (opção B). Sem advisory de segurança aberto. | `pnpm add next@16.3.5 eslint-config-next@16.3.5`. |
| L-13 | Low | `src/components/doar/steps/DadosStep.tsx:32-41` | WhatsApp é coletado (opcional) também em Pix/boleto sem finalidade declarada (minimização, art. 6º, III). No cartão é obrigatório, com justificativa do Asaas. | Mostrar o campo só quando `metodo === "cartao"`, ou declarar a finalidade no help ("para avisos sobre sua doação"). |
| I-01 | Info | arquitetura | Cartão transparente via servidores próprios põe Vercel e Laravel em escopo PCI DSS (SAQ D, não A/A-EP). Decisão aceita (spec-delta:25). | Garantir que Log Drains/Observability/APM da Vercel e da Laravel **nunca** capturem body de request, e que nenhum middleware futuro (Sentry, OpenTelemetry) serialize `request.body` de `/api/doacoes`. Registrar isso como regra no AGENTS.md. |
| I-02 | Info | `src/components/doar/screens/TelaPixAguardando.tsx:69` | `qr_code_base64` é interpolado num `data:` URL sem validar charset/tamanho. `<img>` com `data:image/png` não executa script (sem risco de XSS), mas lixo gera imagem quebrada. | Opcional: `/^[A-Za-z0-9+/=]{100,20000}$/` antes de renderizar. |
| I-03 | Info | `security_scan.py` | Falsos positivos: "exec()/new Function" em `design/prototype/support.js` (arquivo do protótipo, fora de `src/` e de `public/`, não vai para o bundle; `RegExp.exec` não é injeção) e "Missing lock file npm/yarn" (o projeto usa pnpm e `pnpm-lock.yaml` existe e não está ignorado). | Nenhuma ação. Opcional: adicionar `design/` ao `.vercelignore`. |
| I-04 | Info | `src/app/api/doacoes/[id]/status/route.ts:18` | O status é público por capability (UUID). Retorna só `{ id, status, pago }`, sem PII: aceitável. UUID v4/v7 não é enumerável. | Manter. Com M-02 aplicado, o shape fica garantido pelo proxy. |
| I-05 | Info | `package.json`, `pnpm-workspace.yaml` | Supply chain: lockfile presente e commitável, `allowBuilds` restritivo (bom). Todo o repo ainda está untracked. | Commitar `pnpm-lock.yaml`. Considerar `minimumReleaseAge: 1440` em `pnpm-workspace.yaml` (quarentena de 24h contra pacotes recém-publicados/sequestrados). A Vercel já instala com lockfile congelado. |

---

## Snippets de correção

### S-1 — config do upstream fail-closed (M-01)

```ts
// src/lib/api/upstream.ts
const SLUG_REGEX = /^[a-z0-9-]{1,64}$/;
const MIN_TOKEN_LENGTH = 32;

type UpstreamConfig = { baseUrl: string; slug: string; proxyToken: string };

export function getUpstreamConfig(): UpstreamConfig | null {
  const { API_URL, CAMPAIGN_SLUG, CAMPAIGN_PROXY_TOKEN } = process.env;
  if (!API_URL || !CAMPAIGN_SLUG || !CAMPAIGN_PROXY_TOKEN) return null;
  if (!SLUG_REGEX.test(CAMPAIGN_SLUG) || CAMPAIGN_PROXY_TOKEN.length < MIN_TOKEN_LENGTH) return null;
  const url = URL.canParse(API_URL) ? new URL(API_URL) : null;
  if (!url) return null;
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
  return { baseUrl: API_URL.replace(/\/$/, ""), slug: CAMPAIGN_SLUG, proxyToken: CAMPAIGN_PROXY_TOKEN };
}
```

```ts
// src/app/api/doacoes/route.ts (início do POST, antes de request.text())
const config = getUpstreamConfig();
if (!config) {
  console.error("[doacoes] config do upstream ausente ou invalida");
  return Response.json({ message: GENERIC_ERROR_MESSAGE }, { status: 503 });
}
```

`getCampaignStats` e o proxy de status podem usar a mesma função, sem exigir token. Hoje `stats.ts` já cai no fallback,
então lá a mudança é só de consistência. Também gerar o token com `openssl rand -base64 48` e documentar o tamanho mínimo
no `.env.example`.

### S-2 — status com allowlist, shape e timeout (M-02)

```ts
const statusSchema = z.object({ id: z.string().uuid(), status: z.string().max(32), pago: z.boolean() });
const STATUS_TIMEOUT_MS = 8_000;

const upstreamResponse = await fetch(campaignUpstreamUrl(`/doacoes/${id}/status`), {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(STATUS_TIMEOUT_MS),
});
if (upstreamResponse.status === 404) return jsonNoStore({ message: "Doação não encontrada." }, 404);
if (upstreamResponse.status === 429) return jsonNoStore({ message: "Muitas consultas." }, 429);
if (upstreamResponse.status !== 200) {
  console.error("[doacoes-status] upstream falhou", upstreamResponse.status);
  return jsonNoStore({ message: GENERIC_ERROR_MESSAGE }, 502);
}
const parsed = statusSchema.safeParse(await upstreamResponse.json());
if (!parsed.success) return jsonNoStore({ message: GENERIC_ERROR_MESSAGE }, 502);
return jsonNoStore(parsed.data, 200);
```

---

## Headers propostos (H-01)

### Restrições consideradas

- **Scripts do Next (App Router)**: o HTML traz scripts inline (`self.__next_f.push(...)`). Sem nonce, `script-src` exige
  `'unsafe-inline'`. Hashes não servem porque o conteúdo do payload RSC muda a cada página e build.
- **Nonce**: exige gerar a CSP por request em `src/proxy.ts` (novo nome do middleware no Next 16) e torna a rota
  dinâmica. `/` hoje é estática com ISR de 60s (perderia o cache). `/doar` já é dinâmica (`ƒ` no build), então nela o
  nonce **não custa nada**.
- **BotID**: `withBotId` cria rewrites same-origin (`/149e9513-.../a-4-a/c.js` e `/149e9513-.../p.js` para
  `api.vercel.com/bot-protection`), então `script-src 'self'` e `connect-src 'self'` bastam. Ele também registra, **depois**
  dos headers do usuário, `X-Frame-Options: SAMEORIGIN` e `frame-ancestors 'self'` no próprio path. No Next, quando duas
  entradas batem o mesmo path com a mesma chave, vale a última, então um `DENY` global não quebra o BotID. A página-mãe
  precisa de `frame-src 'self'` e `worker-src 'self' blob:` caso o desafio use iframe ou worker. Validar em
  Report-Only; se o console acusar `wasm-eval`, acrescentar `'wasm-unsafe-eval'` ao `script-src`.
- **next/font**: fontes self-hosted em `/_next/static/media`, então `font-src 'self'`.
- **next/image**: só imagens locais (sem `remotePatterns`), servidas por `/_next/image`, então `img-src 'self'`.
- **QR Pix**: `data:image/png;base64`, então `img-src data:`.
- **GSAP/Lenis e `style={{...}}` do React**: estilos via CSSOM não são bloqueados, mas atributos `style=""` no HTML do
  SSR e `<style>` injetados são, então `style-src 'self' 'unsafe-inline'` (risco residual baixo).
- **Dev**: React/Turbopack precisam de `'unsafe-eval'` e de websocket de HMR. `upgrade-insecure-requests` só em produção.

### Opção A (recomendada para já): CSP estática global

```ts
// next.config.ts
import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  // Rollout: trocar a chave para "Content-Security-Policy-Report-Only" no primeiro deploy de preview.
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default withBotId(nextConfig);
```

Observações:

- **HSTS**: a Vercel já envia HSTS por padrão, e o header explícito garante o valor. Só acrescentar `preload` quando
  todos os subdomínios do domínio final estiverem em HTTPS.
- **Permissions-Policy**: `payment=()` só pode ficar se o site nunca usar a Payment Request API (hoje não usa).
- **Cache-Control em `/api`**: se o handler também definir `Cache-Control`, prevalece o do handler (o caso do status,
  que já usa `no-store`).

### Opção B (endurecimento de `/doar`): nonce só na rota do cartão

Pré-requisito: `next@16.3.5` (L-12). Na opção A, excluir `/doar` da CSP estática
(`source: "/:path((?!doar$).*)"` só para a entrada de CSP; os demais headers continuam globais).

```ts
// src/proxy.ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = { matcher: ["/doar"] };
```

Com `'strict-dynamic'`, os scripts que o `initBotId` injeta via `createElement` (c.js/p.js) herdam a confiança do chunk
com nonce. Validar em Report-Only antes de aplicar.

---

## Respostas diretas aos pontos pedidos

1. **Cartão/CPF.** Nenhum `console.*` no client. No server, só status numérico e `error.name` (`route.ts:45,52`,
   `upstream.ts:14-16`). Não há storage de PII: o único `sessionStorage` é a flag do preloader (`Preloader.tsx:30-31`). Não
   há analytics nem scripts de terceiros. Nada vai para a URL (`/doar` só lê `freq` e `valor`). Número e CVV são limpos
   após qualquer desfecho (`DoacaoFlow.tsx:80` chama `useDonationForm.ts:100-102`, e `enviar` nunca lança porque o
   `catch` interno garante a limpeza). O `autocomplete` está correto: `cc-name`, `cc-number`, `cc-exp`, `cc-csc`,
   `postal-code`, `name`, `email`, `tel`, e CPF com `off`. O único destino do payload é `/api/doacoes`. Erros do proxy não
   ecoam o payload, e existe teste que prova que o número do cartão não aparece em log (`tests/unit/api-doacoes-route.test.ts:131+`).
   Pendências: L-06 e L-07.
2. **Proxy.** O IP é confiável na Vercel e spoofável fora dela (L-01). O token não está no bundle: build com sentinela
   deu 0 ocorrências em `.next/static` e `.next/server` (lido em runtime), e o único `NEXT_PUBLIC_` é
   `SITE_URL`/`PAYMENTS_SANDBOX` (não sensíveis). Env ausente é fail-open (M-01). O status está protegido contra SSRF
   (`[id]/status/route.ts:3-4,18`, e a URL é montada só de env). O POST tem timeout de 25s; o status não tem timeout
   (M-02). O status vaza detalhes internos (M-02); o POST está correto no 5xx.
3. **BotID.** `withBotId` + `initBotId` + `checkBotId` corretos e coerentes (path e método batem). Em dev, `checkBotId`
   devolve HUMAN (bypass intencional do pacote). Em preview/produção a verificação é real e exige OIDC. Não há bypass
   por header forjado: o `x-is-human` é validado pela API da Vercel. Riscos: modo Basic sem rate limit (M-03) e previews
   públicos (L-10).
4. **Headers.** Nenhum existe hoje. A config completa está acima (H-01).
5. **Client.** Sem `dangerouslySetInnerHTML`/`innerHTML`/`eval` em `src`, e todo dado da API é renderizado como texto
   pelo React. Todos os `target="_blank"` têm `rel="noopener noreferrer"` (`TelaBoleto.tsx:61-62`, `Visite.tsx:56-57`,
   `Footer.tsx:69-70`). A URL do boleto não é validada (L-03). O clipboard está correto (só escreve texto vindo da
   própria resposta e tem fallback). O polling não tem limite (M-04). As mensagens de erro são genéricas, exceto o 402,
   que exibe `message` da API como texto (ok, desde que a Laravel não ecoe dados).
6. **Dependências.** `pnpm audit --prod` e `pnpm audit` limpos. O lockfile é commitável. Recomendado atualizar para
   `next@16.3.5` (L-12) e aplicar o hardening de I-05.
7. **LGPD.** O CPF tem justificativa exibida e não aparece em nenhuma tela pós-envio. O consentimento está
   inadequado (M-05). Faltam o aviso de privacidade (M-05) e a minimização do telefone (L-13).

## O que está correto (não mexer)

- Segredo só no server: `CAMPAIGN_PROXY_TOKEN` fica fora de `NEXT_PUBLIC_`, não aparece no bundle (build verificado) e o
  header `X-Donor-Ip` é montado pelo proxy (o client não consegue injetá-lo).
- `.env*` ignorado no git e no `.vercelignore`, com exceção só de `.env.example` (sem valores). `.env.local` contém
  apenas `VERCEL_OIDC_TOKEN` (curta duração) e está ignorado.
- UUID validado antes de montar a URL do status (sem SSRF nem path traversal).
- O POST repassa só a allowlist 201/402/403/404/422/429; 5xx e timeout viram 502 genérico, sem corpo da API.
- Logs sem payload: só status e `error.name` (`upstream.ts:14-16`).
- O status usa `Cache-Control: no-store`, e o polling usa `cache: "no-store"`.
- O mapeamento de erros 422 usa allowlist de campos (`errorMapping.ts:9-22`), ignorando chaves desconhecidas.
- O client só guarda final e bandeira do cartão na tela de sucesso (`TelaObrigado.tsx:121-127`).
- Validação client (Luhn, validade, CVV 3-4 dígitos, DV de CPF/CNPJ, faixa de valor), sempre com a Laravel como fonte
  de verdade.
- O polling pausa com a aba oculta e faz backoff exponencial em erro (base boa; falta só o teto, M-04).
- `pnpm-workspace.yaml` com `allowBuilds` restritivo.
- O BotID falha fechado quando lança exceção (não encaminha à API), só que sem resposta controlada (L-04).

## Pendências para a auditoria do backend (Laravel)

- Rejeitar quando `campanha.proxy_token` estiver vazio ou curto (complementa M-01), mantendo `hash_equals`.
- Throttle por `X-Donor-Ip` (após validar o token), e não pelo IP de conexão (M-03).
- `APP_DEBUG=false` em produção, e resposta 402 sem dados do cartão nem mensagem crua do Asaas.
- Idempotency key no POST (M-06).
- `expira_em` em ISO 8601 com offset (M-04).
- Garantir que não existe mass-assignment com campos extras vindos do proxy (L-02).
