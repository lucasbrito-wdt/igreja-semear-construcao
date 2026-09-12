---
type: plan
project: campanha-terreno (Igreja Semear)
date: 2026-09-12
spec: "[[spec-delta]]"
repos:
  front: /Users/lucasbrito/dev/wdt/semear/campanha-terreno (Next.js 16.3.4, Vercel)
  api: /Users/lucasbrito/dev/wdt/semear/api (Laravel 11, Railway, branch feat/campanha-doacoes)
---

# Plano de execução — Site de produção + doações Asaas + efeitos

## Arquitetura

```
Browser ──> Next (Vercel)
             ├─ páginas SSR/ISR  ── getCampaignStats() ──> GET  API /campanhas/{slug}
             ├─ POST /api/doacoes (BotID) ──────────────> POST API /campanhas/{slug}/doacoes  (X-Proxy-Token, X-Donor-Ip)
             └─ GET  /api/doacoes/[id]/status ──────────> GET  API /campanhas/{slug}/doacoes/{id}/status
API Laravel (Railway) ── Domains\Asaas\API\Asaas ──> Asaas v3 (payments, subscriptions, pixQrCode, identificationField)
Asaas ── webhook (asaas-access-token) ──> POST API /webhooks/asaas/doacoes
```

## Waves

| Wave | Tarefa | Repo | Agent | Modelo | Depende de | Estado |
|---|---|---|---|---|---|---|
| 0 | Pesquisa API Asaas v3 | — | general-purpose | sonnet | — | feito |
| 0 | Scaffold Next, protótipo em design/prototype | front | devops-engineer | haiku | — | feito |
| 0 | Mapas da API (Asaas, convenções) | api | explorer-agent x2 | sonnet | — | feito |
| 0 | Mockups telas de pagamento | front | frontend-specialist | sonnet | — | rodando |
| 1 | Port fiel da home (sem efeitos) | front | frontend-specialist | sonnet | scaffold | rodando |
| 1 | Infra PHPUnit + Postgres de teste + branch | api | devops-engineer | sonnet | — | rodando |
| 1 | RED proxy Next + stats (AC-N1..N7) | front | tdd-test-writer | sonnet | contrato | rodando |
| 2 | RED domínio Campanha + webhook (AC-V, P, D, S, C, W) | api | tdd-test-writer | sonnet | infra api | — |
| 2 | GREEN proxy Next + stats + .env.example | front | tdd-implementer | sonnet | RED Next | — |
| 2 | Camada de efeitos sobre a home | front | frontend-specialist | sonnet | port da home | — |
| 3 | GREEN domínio Campanha, Asaas aditivo, middleware webhook | api | tdd-implementer | sonnet | RED api | — |
| 3 | Tela /doar + telas Pix/Boleto/Cartão | front | frontend-specialist | sonnet | GREEN Next, mockups, efeitos | — |
| 4 | REFACTOR api + front | ambos | tdd-refactorer | sonnet | GREENs | — |
| 4 | Auditoria: cartão/PII, webhook, proxy token, BotID, logs, headers | ambos | security-auditor | opus | GREENs | — |
| 5 | E2E AC-U1..U5 + quality gate no diff | front | test-engineer | sonnet | wave 4 | — |
| 5 | Deploy: env Vercel + Railway, webhook no painel Asaas, headers/CSP | ambos | devops-engineer | sonnet | wave 4 | — |

## Catálogo de efeitos

Todos atrás de `prefers-reduced-motion` (nada inicializa com `reduce`, AC-U4). Só `transform`/`opacity`/`clip-path`.

1. Lenis smooth scroll integrado ao ticker do GSAP e às âncoras do menu.
2. Preloader curto (marca + contagem 0-100), só na primeira visita da sessão, máx 1.2s.
3. Hero: SplitText por palavra com máscara, Ken Burns + parallax da fachada, grade de 6 colunas desenhando.
4. Count-up de arrecadado, percentual e doadores + barra crescendo junto.
5. Marquee com velocidade reativa ao scroll (acelera e inverte com a direção).
6. Reveal por seção: h2 com SplitText por linha, parágrafos em fade-up escalonado, filetes de 2px desenhando.
7. Galeria: reveal com clip-path + parallax interno; zoom lento no hover.
8. Etapas: seção pinada com trilho de progresso horizontal (desktop); reveal simples no mobile.
9. Count-up dos números (1.200, 2.400 m², 8).
10. Tiers: tilt 3D sutil + spotlight radial teal seguindo o ponteiro (pointer fine).
11. Botões primários magnéticos com preenchimento deslizante (pointer fine).
12. Citação 2 Coríntios: palavras acendendo com scrub.
13. Barras do orçamento crescendo escalonadas.
14. Barra de progresso de leitura no header (2px teal).
15. Header que esconde ao descer e volta ao subir.
16. Cursor personalizado (anel que cresce sobre clicáveis), só pointer fine.
17. Transição home <-> /doar via View Transitions API (fallback fade).
18. Confirmação: partículas de "sementes" em canvas + check desenhado com stroke.
19. Pix aguardando: pulso, contagem regressiva, QR com reveal em blocos.
20. Microinterações do form: morph de seleção, shake no erro, loading no botão.

## Quality gate (por tarefa, só arquivos alterados)

- Front: `git diff --name-only --diff-filter=ACMRT` -> vitest com cobertura >= 80% em `src/lib` e `src/app/api`, eslint e tsc escopados.
- API: `php artisan test --filter=Campanha` + webhook; pint só nos arquivos alterados.
- Zero `catch` vazio, `@ts-ignore`, `as any`; zero log de cartão, CPF completo ou payload inteiro de webhook.

## Checklist de deploy (bloqueia produção, não o desenvolvimento)

- [ ] Chave Asaas sandbox no Railway (`ASAAS_HOST`, `ASAAS_ACCESS_TOKEN`) — já existem para os outros domínios; confirmar ambiente.
- [ ] `ASAAS_WEBHOOK_TOKEN` gerado, no Railway E cadastrado como authToken em TODOS os webhooks do painel Asaas
      (os antigos passam a exigir o token — cadastrar no mesmo deploy, senão inscrições/rifa/loja recebem 401).
- [ ] Webhook novo no painel Asaas: `https://<api>/webhooks/asaas/doacoes`, eventos PAYMENT_* e SUBSCRIPTION_*.
- [ ] `CAMPANHA_PROXY_TOKEN` no Railway e o mesmo valor como `CAMPAIGN_PROXY_TOKEN` na Vercel.
- [ ] Vercel: `API_URL`, `CAMPAIGN_SLUG=templo`, `NEXT_PUBLIC_SITE_URL`; framework preset Next.js; BotID habilitado.
- [ ] Confirmar meta (R$ 2.400.000), `arrecadado_base` e os números do protótipo (412 famílias, 138 mensais, 42%).
- [ ] Tokenização/cartão transparente em produção pode exigir habilitação pelo Asaas — validar com o gerente da conta.

---

## Status em 2026-09-12 (fim da sessão de construção)

### Concluído

| Item | Repo | Evidência |
|---|---|---|
| Scaffold Next 16.3.4 + protótipo preservado em design/prototype | front | commit baseline 2c58dd9 |
| Home portada fiel ao protótipo, contador via getCampaignStats + ISR 60s | front | build OK |
| Efeitos 1-17 (Lenis, SplitText, pin, count-up, tilt, cursor, View Transitions) | front | reduced-motion validado com Playwright |
| Tela /doar completa (form, Pix, boleto, cartão, recusado, erro, obrigado) + efeitos 18-20 | front | E2E 30/30 |
| Proxy /api/doacoes e /api/doacoes/[id]/status com BotID, fail-closed, allowlist, timeout, Idempotency-Key | front | 85 testes unit |
| Validação de CPF/CNPJ, Luhn, bandeira, regras da doação | front | cobertura 97% |
| Headers de segurança + CSP (nonce em /doar, unsafe-inline na home estática) | front | zero violações no Playwright |
| Domínio Campanha (schema, models, stats, criação, status) | api | 45 testes |
| Webhook /webhooks/asaas/doacoes idempotente + ValidateAsaasWebhook corrigido e aplicado às 2 rotas antigas | api | incluído nos 45 |
| Auditoria de segurança do front | ambos | docs/security-audit-front.md (0 Critical, 1 High corrigido) |

| Backend implementado e GREEN (idempotência, timeout, throttle) | api | 52 testes unitários/feature |
| Refactor: Client Asaas com timeout global | api | timeout 30s adicionado |
| Auditoria de segurança do backend | api | docs/security-audit-api.md |
| Correções Low da auditoria do front (L-11, L-12, L-13) | front | .gitignore, next 16.3.5, help text |

### Pendente
- Tratar issues apontadas no `docs/security-audit-api.md`.
- Deploy: ver checklist acima.

### Dívidas registradas
- `routes/api.php` usava `require_once`, corrigido para `require` (rotas v1 sumiam no 2o boot da app no mesmo processo; afeta PHPUnit e Octane sem route:cache).
- `docs/security-audit-front.md` lista L-10 pendente, que é apenas configuração de deploy (Vercel).
