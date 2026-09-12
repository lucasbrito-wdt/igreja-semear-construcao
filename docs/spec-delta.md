---
type: spec-delta
project: campanha-terreno (Igreja Semear)
date: 2026-09-12
status: approved-architecture
repos: ["semear/campanha-terreno (Next.js, Vercel)", "semear/api (Laravel 11, Railway)"]
---

# Spec-delta — Site de produção + doações via Asaas

## Contexto

- Front: protótipo do Claude Design (`design/prototype/`) portado para Next.js 16 na Vercel.
- Back: API Laravel existente (`/Users/lucasbrito/dev/wdt/semear/api`), padrão Controller -> BLL -> Service -> Model,
  UUID, migrations por domínio autocarregadas, domínio `Asaas` já existente (chave global via env, sem assinaturas).
- A mesma conta Asaas cobra inscrições, loja e rifa: o contador da campanha NÃO pode vir de estatísticas do Asaas.

## Decisões (ADR resumido)

| Decisão | Escolha | Descartado e por quê |
|---|---|---|
| Onde mora a integração | Novo domínio `Campanha` na API Laravel, reaproveitando `Domains\Asaas\API\Asaas` | Route Handlers no Next falando com o Asaas: duplicaria chave e lógica que já existem na API |
| Contador | `SUM` dos pagamentos pagos da campanha + `arrecadado_base` da campanha | `/finance/payment/statistics`: soma a conta inteira (inscrições, loja, rifa) |
| Doação mensal | Assinatura Asaas `MONTHLY`; cada cobrança paga vira linha em `doacao_pagamentos` | Criar cobrança manual todo mês: reinventa a recorrência |
| Cartão | Transparente: Next proxy -> Laravel -> Asaas, com `remoteIp` do doador; nunca persistido nem logado (só final e bandeira) | Fatura hospedada: usuário escolheu transparente |
| Anti-fraude | Next `/api/doacoes` com Vercel BotID; Laravel só aceita criação com `X-Proxy-Token` válido; throttle por IP | Browser direto na API: CORS `*` expõe o endpoint a card-testing |
| Webhook | Rota nova `POST /webhooks/asaas/doacoes` com `ValidateAsaasWebhook`, idempotente por `event.id`; o middleware é corrigido e aplicado também às 2 rotas antigas | Manter rotas abertas: qualquer um forja "pagamento recebido" |
| Tenant | Campanha resolvida por slug na URL (padrão da Rifa); `igreja_id` vem do registro | Header/subdomínio: não existe no projeto |
| Efeitos | GSAP (ScrollTrigger, SplitText) + Lenis, desligados com `prefers-reduced-motion` | Motion: menos recursos de scroll/split |

## Contrato da API Laravel (snake_case, sem envelope, erros de validação no 422 padrão do Laravel)

Arquivo de rotas novo `routes/v1/campanha.php` (incluído por `routes/api.php`, mesmo padrão dos demais).

### GET /campanhas/{slug}
200 `{ slug, titulo, meta, arrecadado, percentual, doadores, mensais_ativos, atualizado_em }`
- `arrecadado` = soma de `doacao_pagamentos.valor` com status pago + `campanhas.arrecadado_base`.
- `percentual` limitado a 100, 1 casa decimal. `doadores` = CPF/CNPJ distintos com ao menos 1 pagamento pago.
- `mensais_ativos` = doações mensais com assinatura ativa e ao menos 1 pagamento pago.
404 se slug inexistente ou campanha inativa.

### POST /campanhas/{slug}/doacoes  (throttle 10/min por IP; exige header `X-Proxy-Token`)
Headers: `X-Proxy-Token` (== `config('campanha.proxy_token')`, comparação `hash_equals`), `X-Donor-Ip` (IP do doador, usado como `remoteIp`).
Body:
```
{ frequencia: "unica"|"mensal", metodo: "pix"|"boleto"|"cartao", valor: number (10..100000, 2 casas),
  nome: string, email: string, cpf_cnpj: string (dígitos ou máscara, DV validado), telefone: string (obrigatório se cartao),
  recibo: boolean,
  cartao?: { titular, numero, mes, ano, cvv },      // obrigatório se metodo=cartao
  endereco?: { cep, numero } }                     // obrigatório se metodo=cartao
```
201:
```
{ id: uuid, status: "pendente"|"pago", frequencia, metodo, valor,
  pix?: { qr_code_base64, copia_e_cola, expira_em },
  boleto?: { url, linha_digitavel, vencimento },
  cartao?: { aprovado: true, final: "1234", bandeira: "VISA" },
  proxima_cobranca?: "YYYY-MM-DD" }                // só mensal
```
Erros: 403 proxy token ausente/errado (não chama Asaas); 404 campanha; 422 validação (não chama Asaas);
402 `{ message }` cartão recusado (sem ecoar dados); 502 `{ message }` falha/timeout do Asaas; 429 throttle.

### GET /campanhas/{slug}/doacoes/{id}/status
200 `{ id, status, pago: boolean }`. Lê o banco; se pendente e última consulta ao Asaas há mais de 10s, consulta
`/payments/{id}/status` e atualiza. 404 se não existe ou não pertence à campanha.

### POST /webhooks/asaas/doacoes  (middleware ValidateAsaasWebhook)
- 401 sem `asaas-access-token` válido (`hash_equals` com `config('asaas.webhook_token')`; token não configurado = 401).
- Evento já processado (`event.id` em `campanha_webhook_eventos`) -> 200 sem efeito.
- `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` de pagamento conhecido (por `asaas_payment_id` ou `subscription`) -> marca/cria
  `doacao_pagamentos` como pago. Pagamento desconhecido -> 200 sem efeito (é de outro domínio).
- `PAYMENT_REFUNDED`/`PAYMENT_CHARGEBACK_*` -> estornado (sai da soma). `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_INACTIVATED` -> inativa.
- Nunca loga o payload inteiro; loga só event id, tipo e payment id.

## Contrato do proxy Next (Vercel)

- `POST /api/doacoes`: `checkBotId()` -> 403 `{ message }` se bot. Encaminha o body para
  `${API_URL}/campanhas/${CAMPAIGN_SLUG}/doacoes` com `X-Proxy-Token: CAMPAIGN_PROXY_TOKEN` e `X-Donor-Ip` (primeiro IP
  de `x-forwarded-for`, senão `x-real-ip`). Timeout 25s. Repassa status e corpo de 201/402/403/404/422/429; 5xx ou
  timeout -> 502 `{ message }` genérica. Nunca loga o body.
- `GET /api/doacoes/[id]/status`: valida UUID (400 se inválido, sem chamar a API) e encaminha.
- `getCampaignStats()` (server): `fetch(${API_URL}/campanhas/${CAMPAIGN_SLUG}, { next: { revalidate: 60, tags: ['campaign-stats'] } })`
  mapeado para `CampaignStats` camelCase; em erro retorna `FALLBACK_STATS`.
- Env Next: `API_URL`, `CAMPAIGN_SLUG`, `CAMPAIGN_PROXY_TOKEN`, `NEXT_PUBLIC_SITE_URL`. Nenhuma chave Asaas no Next.

## ADDED
- API: domínio `Campanha` (models `Campanha`, `Doacao`, `DoacaoPagamento`, `CampanhaWebhookEvento`), migrations, seeder da
  campanha `templo` (meta 2.400.000), `config/campanha.php`, rotas acima, testes PHPUnit (infra nova: `phpunit.xml`, `tests/`).
- API/Asaas: métodos `criarAssinatura`, `listarCobrancasAssinatura`, `obterLinhaDigitavel` em `API/Asaas.php` (aditivo).
- Next: proxy `/api/doacoes`, `/api/doacoes/[id]/status`, `getCampaignStats`, tela `/doar` completa, telas Pix/Boleto/Cartão, efeitos.

## MODIFIED
- API: `config/asaas.php` ganha `webhook_token` (env `ASAAS_WEBHOOK_TOKEN`); `ValidateAsaasWebhook` passa a comparar só o
  token com `hash_equals` e falhar fechado; aplicado a `routes/web.php:24` e `routes/v1/landing-page.php:34`.
- Front: contador do hero vem de `getCampaignStats()`; `submit` do form chama `/api/doacoes`.

## REMOVED
- Front: runtime `support.js`/`<x-dc>` do site servido (preservado em `design/prototype/`); aviso "ambiente de demonstração".
- API: verificação HMAC `X-Asaas-Signature` do middleware (o Asaas não envia esse header; código morto).

## Critérios de aceite (cada um vira nome de teste)

### API — validação (Feature, POST doacoes)
- AC-V1 GIVEN valor abaixo de 10 WHEN cria doação THEN 422 com erro em `valor` e nenhuma chamada HTTP ao Asaas.
- AC-V2 GIVEN CPF com DV inválido WHEN cria THEN 422 em `cpf_cnpj`.
- AC-V3 GIVEN CNPJ válido WHEN cria THEN aceita.
- AC-V4 GIVEN metodo cartao sem `cartao`, `endereco` ou `telefone` WHEN cria THEN 422 por campo ausente.
- AC-V5 GIVEN e-mail malformado WHEN cria THEN 422 em `email`.

### API — criação
- AC-P1 GIVEN sem `X-Proxy-Token` válido WHEN cria THEN 403 e nenhuma chamada ao Asaas.
- AC-P2 GIVEN slug inexistente WHEN cria THEN 404.
- AC-D1 GIVEN doação única Pix válida WHEN cria THEN 201 com `pix.qr_code_base64`, `pix.copia_e_cola`, `id`; persiste doação e pagamento pendente.
- AC-D2 GIVEN doação única boleto WHEN cria THEN 201 com `boleto.url` e `boleto.linha_digitavel`.
- AC-D3 GIVEN cartão aprovado WHEN cria THEN 201 `cartao.aprovado=true`, envia `remoteIp` = `X-Donor-Ip`, persiste só final/bandeira.
- AC-D4 GIVEN cartão recusado pelo Asaas WHEN cria THEN 402 com mensagem amigável, sem número/CVV na resposta nem no log.
- AC-D5 GIVEN doação mensal WHEN cria THEN cria assinatura `MONTHLY`, busca a 1a cobrança e responde com os dados dela e `proxima_cobranca`.
- AC-D6 GIVEN CPF já cadastrado no Asaas WHEN cria THEN reutiliza o customer (GET por cpfCnpj) sem criar outro.
- AC-D7 GIVEN Asaas 5xx ou timeout WHEN cria THEN 502 genérico e doação marcada com falha.

### API — status e contador
- AC-S1 GIVEN pagamento pago WHEN consulta status THEN `{ pago: true }`.
- AC-S2 GIVEN id de outra campanha ou inexistente WHEN consulta THEN 404.
- AC-C1 GIVEN pagamentos pagos, pendentes e estornados WHEN GET campanha THEN `arrecadado` soma só os pagos + base.
- AC-C2 GIVEN 2 pagamentos do mesmo CPF WHEN GET campanha THEN `doadores` conta 1.
- AC-C3 GIVEN arrecadado acima da meta WHEN GET campanha THEN `percentual` = 100.

### API — webhook
- AC-W1 GIVEN token ausente, errado ou não configurado WHEN POST webhook (nova rota e as 2 antigas) THEN 401.
- AC-W2 GIVEN `PAYMENT_RECEIVED` de pagamento da campanha WHEN POST THEN marca pago e responde 200.
- AC-W3 GIVEN o mesmo `event.id` duas vezes WHEN POST THEN processa uma vez só.
- AC-W4 GIVEN pagamento de outra cobrança da assinatura (mês 2) WHEN `PAYMENT_RECEIVED` com `subscription` conhecida THEN cria novo `doacao_pagamentos` pago.
- AC-W5 GIVEN pagamento desconhecido WHEN POST THEN 200 sem efeito.

### Next — proxy e stats (Vitest)
- AC-N1 GIVEN BotID classifica como bot WHEN POST /api/doacoes THEN 403 e não chama a API.
- AC-N2 GIVEN requisição humana WHEN POST THEN encaminha com `X-Proxy-Token` e `X-Donor-Ip` do primeiro IP de `x-forwarded-for`.
- AC-N3 GIVEN API responde 201/402/422 WHEN POST THEN repassa status e corpo.
- AC-N4 GIVEN API 5xx ou timeout WHEN POST THEN 502 com mensagem genérica.
- AC-N5 GIVEN id não-UUID WHEN GET status THEN 400 sem chamar a API.
- AC-N6 GIVEN API de campanha ok WHEN `getCampaignStats` THEN mapeia snake_case para `CampaignStats`.
- AC-N7 GIVEN API de campanha falhando WHEN `getCampaignStats` THEN retorna `FALLBACK_STATS`.

### UI / E2E (Playwright, proxy mockado por rota)
- AC-U1 GIVEN Pix WHEN confirma THEN vê QR e copiar; quando status vira pago, vê "Obrigado, {nome}".
- AC-U2 GIVEN método Cartão WHEN selecionado THEN campos de cartão e endereço aparecem; com Pix ficam ocultos.
- AC-U3 GIVEN clique num tier WHEN na home THEN abre `/doar` com o valor pré-selecionado.
- AC-U4 GIVEN `prefers-reduced-motion: reduce` WHEN carrega THEN nenhum efeito GSAP/Lenis inicializa.
- AC-U5 GIVEN viewport 390px WHEN qualquer página THEN sem scroll horizontal.

### Front — validação do formulário (Vitest)
- AC-F1 GIVEN CPF válido (com ou sem máscara) WHEN valida THEN aceita; GIVEN CPF com DV errado, todos os dígitos
  iguais ou tamanho errado WHEN valida THEN rejeita.
- AC-F2 GIVEN CNPJ válido (com ou sem máscara) WHEN valida THEN aceita; GIVEN CNPJ inválido WHEN valida THEN rejeita;
  `isValidCpfCnpj` roteia por tamanho (11 dígitos = CPF, 14 = CNPJ).
- AC-F3 GIVEN entrada parcial ou completa de CPF/CNPJ WHEN formata THEN aplica máscara progressiva
  (000.000.000-00 / 00.000.000/0000-00).
- AC-F4 GIVEN número de cartão de teste público válido WHEN aplica Luhn THEN aceita; GIVEN número alterado
  (um dígito trocado) WHEN aplica Luhn THEN rejeita.
- AC-F5 GIVEN prefixo de bandeira conhecido (visa, mastercard, amex, elo, hipercard) WHEN detecta THEN retorna a
  bandeira correta; GIVEN prefixo desconhecido WHEN detecta THEN retorna `unknown`.
- AC-F6 GIVEN mês/ano de validade com `now` fixo WHEN valida THEN mês corrente é válido, mês passado é inválido,
  ano com 2 dígitos é aceito, mês 13 é inválido.
- AC-F7 GIVEN valor fora de 10..100000, e-mail malformado, nome vazio ou com uma única palavra, ou CPF/CNPJ inválido
  WHEN valida doação THEN erro no campo correspondente (`valor`, `email`, `nome`, `cpfCnpj`).
- AC-F8 GIVEN metodo cartao sem telefone válido (10-11 dígitos), sem campos de cartão válidos (Luhn, validade futura,
  CVV) ou sem endereço válido (CEP 8 dígitos, número) WHEN valida THEN erro nos campos correspondentes; GIVEN metodo
  pix ou boleto com campos de cartão preenchidos e inválidos WHEN valida THEN ignora esses campos e aceita.
- AC-F9 GIVEN doação válida WHEN monta o payload da API THEN gera o body snake_case do contrato, com documentos e
  telefone só dígitos, ano de validade com 4 dígitos, e omite `cartao`/`endereco` quando metodo != cartao.

### Next — hardening do proxy (auditoria front)
- AC-N8 (M-01) GIVEN `CAMPAIGN_PROXY_TOKEN` ou `API_URL` ou `CAMPAIGN_SLUG` ausentes/vazios WHEN POST /api/doacoes
  THEN 503 `{ message }` genérica e fetch NÃO é chamado (o cartão nunca sai do servidor sem destino confiável).
- AC-N9 (M-01) GIVEN `NODE_ENV=production` e `API_URL` com `http://` WHEN POST THEN 503 e fetch não chamado; em
  `NODE_ENV=test`/development `http://localhost` é aceito.
- AC-N10 (M-02) GIVEN a API responde status fora da allowlist do status route (allowlist: 200, 404, 429) WHEN GET
  status THEN 502 genérico sem repassar o corpo; e o fetch do status é chamado com `signal` (timeout) — asserte que
  `init.signal` é um AbortSignal.
- AC-N11 (L-01) GIVEN `x-forwarded-for` com valor que não é IP válido (ex. "abc, 1.2.3.4" ou "<script>") WHEN POST
  THEN o header `X-Donor-Ip` NÃO é enviado com o valor inválido (é omitido); GIVEN IPv6 válido THEN é repassado.
- AC-N12 (M-06) GIVEN header `Idempotency-Key` com UUID válido na requisição WHEN POST THEN o proxy repassa
  `Idempotency-Key` idêntico à API; GIVEN valor inválido (não-UUID) THEN 400 `{ message }` sem chamar a API; GIVEN
  ausente THEN encaminha sem o header (compatibilidade).

### API — idempotência e hardening (auditoria)
- AC-D8 (M-06) GIVEN duas requisições POST idênticas com o MESMO header `Idempotency-Key` WHEN criadas THEN a
  segunda devolve a mesma doação (mesmo `id`, mesmo `status`) e NENHUMA nova chamada ao Asaas é feita.
- AC-D9 (M-06) GIVEN duas requisições com chaves `Idempotency-Key` DIFERENTES WHEN criadas THEN duas doações
  distintas são criadas.
- AC-D10 (M-06) GIVEN requisição SEM `Idempotency-Key` WHEN criada THEN fluxo normal (cria) e `idempotency_key`
  fica nulo.
- AC-D11 (M-06) GIVEN header `Idempotency-Key` presente WHEN a doação é criada THEN o valor é persistido em
  `doacoes.idempotency_key` e NÃO aparece na resposta JSON.
- AC-D12 GIVEN doação criada com sucesso WHEN persistida THEN `asaas_customer_id` guarda o id do cliente
  retornado/encontrado no Asaas.
- AC-P3 (M-03) GIVEN 11 requisições válidas do MESMO `X-Donor-Ip` (mesmo IP de conexão) WHEN enviadas THEN a 11a
  recebe 429; GIVEN 11 requisições de `X-Donor-Ip` DIFERENTES (mesmo IP de conexão, como acontece atrás do proxy
  da Vercel) THEN nenhuma recebe 429 (o throttle deve ser chaveado pelo IP do doador, não pelo IP de conexão).
- AC-D13 (M-06) GIVEN o Asaas demorando além do limite WHEN a doação é criada THEN a chamada é abortada por
  timeout e a resposta é 502.
