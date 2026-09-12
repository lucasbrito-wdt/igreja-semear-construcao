---
type: security-audit
scope: api
date: 2026-09-12
repo: semear/api
branch: feat/campanha-doacoes
stack: [Laravel 11, PHP 8.4, PostgreSQL, Railway, Octane/Swoole]
related: ["[[spec-delta]]", "[[security-audit-front]]"]
---

# Auditoria de segurança — API Laravel (domínio Campanha)

## Sumário executivo

O domínio `Campanha` foi escrito com cuidado nos pontos que normalmente quebram: nenhum dado de cartão é
persistido (só `cartao_final` e `cartao_bandeira`), nenhum `Log::`/`dd`/`dump` toca o payload da doação,
não existe SQL raw em lugar nenhum do domínio, não há mass-assignment (o array do `Doacao::create` é montado
campo a campo), o proxy token e o token do webhook usam `hash_equals` com falha fechada, e a idempotência do
webhook é feita por `unique` no banco dentro de transação (correta contra corrida).

O problema grave não está no domínio: está na plataforma em volta dele.

**O Telescope está em `require` do composer (vai para produção), `enabled` tem default `true`, e o filtro do
`TelescopeServiceProvider` grava o entry de request inteiro — incluindo `payload` — sempre que a resposta é
`>= 500`.** O caminho `Asaas indisponível -> 502` é um caminho **rotineiro e previsto no contrato** (AC-D7).
Ou seja: numa instabilidade do Asaas, cada doação com cartão em voo grava **número do cartão e CVV em claro**
na tabela `telescope_entries` do mesmo Postgres da aplicação. Isso é armazenamento de PAN+CVV, proibido por
PCI-DSS em qualquer leitura, e não é hipotético — basta o Asaas dar 5xx ou timeout uma vez.

Em segundo plano há dois problemas de disponibilidade/abuso que se reforçam: `TrustProxies` não confia em
nenhum proxy, então `$request->ip()` é sempre o IP de egress do Railway (todos os throttles por IP viram
limites globais compartilhados), e o throttle de criação é chaveado por `X-Donor-Ip`, um header que o próprio
atacante controla se tiver o proxy token — os dois somados deixam o limite de 10/min sem valor prático contra
card-testing e, ao mesmo tempo, permitem derrubar a API inteira com 60 requisições por minuto.

Contagem: **1 Critical, 4 High, 12 Medium, 10 Low, 2 Info.**

---

## Achados

### Critical

| ID | Sev | file:line | Problema | Correção |
|---|---|---|---|---|
| **C-01** | Critical | `config/telescope.php:19`, `config/telescope.php:195-205`, `app/Providers/TelescopeServiceProvider.php:60-67`, `app/Providers/TelescopeServiceProvider.php:79`, `composer.json:29` | **PAN + CVV gravados em claro no banco.** `'enabled' => env('TELESCOPE_ENABLED', true)` é fail-open; `laravel/telescope` está em `require` (o `composer install --no-dev` do `Dockerfile:45` **não** o remove); o `RequestWatcher` está ligado e grava `payload` (= `$request->input()` completo, com `cartao.numero` e `cartao.cvv`); o `Telescope::filter` mantém o entry quando `isFailedRequest()`, que é `response_status >= 500` (`vendor/laravel/telescope/src/IncomingEntry.php:199-203`). Como `AsaasIndisponivelException` responde **502** (`app/Domains/Campanha/Exceptions/AsaasIndisponivelException.php:15`), qualquer 5xx/timeout do Asaas grava o cartão inteiro em `telescope_entries`. `hideSensitiveRequestDetails()` só esconde `_token` — e `hideRequestParameters` não alcança chaves aninhadas (`cartao.numero`). Em `local` o filtro grava **tudo**, inclusive as doações bem-sucedidas. | Três camadas (todas): (1) default fechado, (2) rota nunca observada, (3) parâmetros mascarados. Ver snippet abaixo. |

```php
// config/telescope.php:19
'enabled' => env('TELESCOPE_ENABLED', false),   // fail-closed

// config/telescope.php:107 (ignore_paths)
'ignore_paths' => [
    'livewire*', 'nova-api*', 'pulse*',
    'api/campanhas/*/doacoes',        // nunca observar o endpoint de cartão
    'api/webhooks/asaas/*',
],
```

```php
// app/Providers/TelescopeServiceProvider.php — register()
Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
    // Nunca persistir nada da rota que trafega cartão, nem em local.
    if (($entry->content['uri'] ?? '') && str_contains($entry->content['uri'], '/doacoes')) {
        return false;
    }

    return $isLocal
        || $entry->isReportableException()
        || $entry->isFailedRequest()
        || $entry->isFailedJob()
        || $entry->isScheduledTask()
        || $entry->hasMonitoredTag();
});

// hideSensitiveRequestDetails(): tirar o early-return de 'local' e mascarar de fato
Telescope::hideRequestParameters(['_token', 'cartao', 'numero', 'cvv', 'ccv', 'cpf_cnpj']);
Telescope::hideRequestHeaders(['cookie', 'x-csrf-token', 'x-xsrf-token', 'x-proxy-token', 'access_token', 'asaas-access-token']);
```

Complementos obrigatórios: mover `laravel/telescope` para `require-dev` (e `TelescopeServiceProvider` para
registro condicional em `AppServiceProvider::register()` com `$this->app->environment('local')`); cravar
`TELESCOPE_ENABLED=false` nas variáveis do Railway; e **fazer um purge retroativo** de `telescope_entries`
caso a API já tenha rodado com cartão em produção (`php artisan telescope:clear`).

### High

| ID | Sev | file:line | Problema | Correção |
|---|---|---|---|---|
| **H-01** | High | `app/Providers/RouteServiceProvider.php:35`, `app/Http/Middleware/VerifyCampanhaProxyToken.php:26-32` | **Throttle de criação chaveado por header controlado pelo cliente.** `Limit::perMinute(10)->by($request->header('X-Donor-Ip') ?: $request->ip())`. O middleware só valida que o header **é um IP** (`FILTER_VALIDATE_IP`), não que é o IP real. Quem possuir o `X-Proxy-Token` (ex.: vazamento de env da Vercel, ou o próprio operador do site) varia `X-Donor-Ip` a cada requisição e obtém **concorrência ilimitada** de tentativas de cartão — card-testing em escala na conta Asaas da igreja, com custo por tentativa e risco de bloqueio do MID. O mesmo header vira `remoteIp` no antifraude do Asaas (`DoacaoService.php:249`) e é persistido em `doacoes.remote_ip`: antifraude envenenado e forense inútil. | Chavear o limite pelo **par** (IP de conexão + donor IP), e limitar também o IP de conexão: `RateLimiter::for('campanha-doacoes', fn (Request $r) => [Limit::perMinute(10)->by('donor:'.$r->header('X-Donor-Ip').'|'.$r->ip()), Limit::perMinute(30)->by('conn:'.$r->ip())]);`. Somar um limite por CPF/e-mail (`Limit::perMinute(3)->by('doc:'.hash('sha256', $r->input('cpf_cnpj')))`) e um circuit breaker de recusas: N recusas 402 seguidas do mesmo donor IP/CPF -> bloqueio de 15 min. Registrar (sem PAN) toda recusa para detecção. |
| **H-02** | High | `app/Http/Middleware/TrustProxies.php:15`, `app/Http/Kernel.php:75`, `routes/v1/campanha.php:16`, `app/Providers/RouteServiceProvider.php:28` | **`$proxies = null`: nenhum proxy confiável.** Atrás do proxy HTTP do Railway, `$request->ip()` devolve sempre o IP interno do edge. Consequências: (a) o limiter global `api` (`Limit::perMinute(60)->by(... ?: $request->ip())`) vira um limite de **60 req/min para a API inteira, compartilhado por todos os clientes** — qualquer pessoa derruba tudo com 1 req/s; (b) o `throttle:60,1` do endpoint de status é igualmente global, e o polling do front (a cada ~3s por doador) esgota a cota com 3 doadores simultâneos, quebrando o fluxo de Pix; (c) todo log/auditoria registra o IP errado. | `protected $proxies = '*';` em `TrustProxies` (padrão para Railway/Heroku, onde o edge reescreve `X-Forwarded-For`). Ciente do trade-off: com `'*'`, `X-Forwarded-For` passa a ser parcialmente influenciável pelo cliente — por isso o throttle da doação deve continuar usando o donor IP **validado pelo proxy token** (H-01), e o limiter global `api` deve subir para um valor compatível com o tráfego real (ex.: `perMinute(120)`) e ser medido depois do ajuste. |
| **H-03** | High | `app/Domains/Campanha/Services/DoacaoService.php:181-183`, `:290-309`, `app/Domains/Campanha/Services/WebhookDoacaoService.php:100-133` | **Cobrança no Asaas sem registro local = doação perdida em silêncio.** O `POST /payments` acontece fora de transação; se o `DoacaoPagamento::create` seguinte falhar (indisponibilidade do banco, `unique` em `asaas_payment_id`, deploy no meio), o doador **já foi cobrado** mas não existe linha de pagamento. O webhook `PAYMENT_RECEIVED` que chega depois não encontra `asaas_payment_id` nem `subscription` (doação única) e **retorna sem efeito** (`:113-117`) — dinheiro cobrado, contador sem somar, doador sem recibo, sem nenhum alerta. | O `externalReference` já carrega o `doacao->id` (`DoacaoService.php:173`): usar como fallback de reconciliação no webhook antes de desistir. Em `marcarPagamentoConfirmado`, depois de falhar por `asaas_payment_id` e por `subscription`: `$doacao = $this->doacao->newQuery()->find($payment['externalReference'] ?? null);` e, se achar, `firstOrCreate` do pagamento por `asaas_payment_id`. Complementar com um job de reconciliação diário (`GET /payments?externalReference=...`) e log de nível `error` quando um `PAYMENT_RECEIVED` com `externalReference` conhecido não bater com nenhum registro. |
| **H-04** | High | `app/Http/Middleware/ValidateAsaasWebhook.php:23-28`, `routes/v1/campanha-webhook.php:8`, `routes/web.php:25`, `routes/v1/landing-page.php:34-35` | **Segredo único, compartilhado por 3 rotas, sem verificação de origem.** A comparação em si está correta (`hash_equals`, falha fechada quando o token não está configurado). Mas o único fator é o header `asaas-access-token`: um vazamento do `ASAAS_WEBHOOK_TOKEN` (ele é digitado no painel do Asaas, aparece em prints, é o mesmo em 3 endpoints) permite forjar `PAYMENT_RECEIVED` e marcar como pago **doações** (contador inflado), **inscrições** e **bilhetes de rifa** (bens entregues sem pagamento). Não há allowlist de IP nem verificação de que o evento existe de fato no Asaas. Piora: em `WebhookDoacaoService.php:127` o **valor** do pagamento de assinatura vem do payload do evento (`$payment['value']`), então o forjador escolhe quanto somar ao contador. | (1) Allowlist de IPs de origem do Asaas no middleware (faixa publicada pelo Asaas), como segunda camada; (2) para eventos de dinheiro, **confirmar contra a fonte**: antes de marcar pago, `GET /payments/{id}/status` no Asaas e só aceitar `RECEIVED`/`CONFIRMED` — isso neutraliza evento forjado mesmo com o token vazado; (3) nunca usar `payment.value` do payload: usar `$doacao->valor` ou o valor retornado pela consulta; (4) tokens distintos por rota quando o painel permitir, com rotação documentada. |

### Medium

| ID | Sev | file:line | Problema | Correção |
|---|---|---|---|---|
| M-01 | Medium | `app/Domains/Asaas/API/Asaas.php:11-12` | `env('ASAAS_HOST')` e `env('ASAAS_ACCESS_TOKEN')` chamados **fora de `config/`**. Com `php artisan config:cache`/`optimize` e `.env` ausente no container, `env()` devolve `null` -> `setBaseUrl(string $baseUrl)` lança `TypeError` -> **500 em todo POST de doação**, e cada um desses 500 grava PAN+CVV no Telescope (encadeia com C-01). Hoje o `Dockerfile` não faz `config:cache`, o que apenas adia o problema. | Criar as chaves em `config/asaas.php` (`'host' => env('ASAAS_HOST')`, `'access_token' => env('ASAAS_ACCESS_TOKEN')`) e trocar por `config('asaas.host')`/`config('asaas.access_token')`. Validar no boot: se vazio, lançar exceção de configuração no `AppServiceProvider` em vez de falhar no meio de um pagamento. |
| M-02 | Medium | `config/campanha.php:4`, `app/Http/Middleware/VerifyCampanhaProxyToken.php:19-24` | Token vazio já falha fechado (bom), mas **token curto/fraco passa**. Pendência M-01 do audit do front pede rejeição por tamanho mínimo. | `if (strlen($tokenConfigurado) < 32 || ! hash_equals(...)) { return response()->json([...], 403); }` — e validar o comprimento também no boot, para falhar no deploy e não em produção. |
| M-03 | Medium | `config/cors.php:22`, `:26` | `allowed_origins => ['*', 'http://localhost:5173']` (contraditório) com `allowed_headers => ['*']` em `paths: ['api/*']`. `GET /campanhas/{slug}` e o endpoint de status ficam legíveis por qualquer origem, e o `POST` de doação fica **tecnicamente chamável de qualquer site** caso o proxy token vaze — exatamente o cenário de card-testing que a ADR quis evitar. | Restringir a origem do site (`env('CAMPANHA_SITE_ORIGIN')` + previews da Vercel via `allowed_origins_patterns`), e `allowed_headers` explícito (`['Content-Type','Accept','X-Proxy-Token','Idempotency-Key']`). Remover o `'*'`. |
| M-04 | Medium | `app/Providers/TelescopeServiceProvider.php:97`, `app/Http/Middleware/TelescopePassword.php:12` | O gate `viewTelescope` usa `Auth::check()` **sem import** — resolve para `App\Providers\Auth`, inexistente, e lança `Error` (fail-closed por acidente, com 500 em vez de 403). Em paralelo existe `TelescopePassword` com senha hardcoded `'103650'`, código morto não referenciado em nenhuma rota — se alguém o "reativar", a UI do Telescope (que contém payloads) fica atrás de uma senha de 6 dígitos em claro no repositório. | Importar `Illuminate\Support\Facades\Auth` e tornar o gate explícito (`return $user?->hasRole('admin') === true;`); apagar `TelescopePassword.php`. Com C-01 aplicado (Telescope fora de produção) o risco cai para residual. |
| M-05 | Medium | `app/Domains/Campanha/Migrations/.../create_doacoes_table.php:20-23,30`, `app/Exceptions/Handler.php:11-19` | **LGPD/retenção.** `nome`, `email`, `cpf_cnpj`, `telefone` e `remote_ip` em claro, sem criptografia e **sem política de retenção nem purge**. `$hidden` protege a serialização acidental (`cpf_cnpj`, `remote_ip`, `idempotency_key`) e as respostas são montadas à mão — correto — mas qualquer `QueryException` no `Doacao::create` produz uma mensagem contendo o SQL **com os bindings** (nome, e-mail, CPF, telefone, IP), que vai para o log e, com `APP_DEBUG=true`, para a resposta HTTP. | (1) `Model::handleQueryExceptionsUsing` ou um `report` no Handler que sanitize a mensagem de `QueryException` para `table + sqlstate`, sem bindings; (2) `$casts` com `encrypted` para `cpf_cnpj`/`telefone` (com índice separado por hash se a busca for necessária) ou, no mínimo, uma coluna `cpf_cnpj_hash`; (3) comando agendado de expurgo: anonimizar `nome/email/telefone/remote_ip` de doações com mais de N anos (a nota fiscal/recibo define o prazo legal); (4) documentar a base legal e o prazo no aviso de privacidade (casa com M-05 do audit do front). |
| M-06 | Medium | `app/Domains/Campanha/Controllers/DoacaoController.php:21`, `.../alter_doacoes_add_idempotency_key.php:15` | `Idempotency-Key` é lido do header e persistido **sem validação de formato ou tamanho**. Coluna é `varchar(36)`; um valor maior gera `QueryException` SQLSTATE `22001` (não `23505`), que é relançado -> **500** -> Telescope grava o cartão (C-01). Confiar na validação do proxy Next é confiar em quem chama. | Validar na borda: `$idempotencyKey = $request->header('Idempotency-Key'); if ($idempotencyKey !== null && ! Str::isUuid($idempotencyKey)) { abort(400, 'Idempotency-Key inválida.'); }` — ou uma regra no `StoreDoacaoRequest` via `prepareForValidation`. |
| M-07 | Medium | `app/Domains/Campanha/Services/DoacaoService.php:134-142`, `:60-66` | Replay de idempotência devolve **só** `{id, status}` (sem `pix`/`boleto`/`cartao`), quebrando o contrato do 201 — um retry legítimo do doador na tela de Pix perde o QR Code. Pior: se a primeira tentativa terminou em `falha`, a chave já está consumida e **toda retentativa com a mesma chave devolve `falha` para sempre**, sem caminho de recuperação. | Persistir a resposta canônica (coluna `resposta_idempotente` json, gravada ao final do fluxo feliz) e devolvê-la no replay. Em `status = falha`, tratar como chave liberada: limpar `idempotency_key` da linha falha (ou incluir o status na unique parcial `WHERE status <> 'falha'`) para permitir nova tentativa. |
| M-08 | Medium | `app/Domains/Shared/Utils/API.php:25`, `app/Domains/Asaas/API/Asaas.php`, `Dockerfile:126` | Apenas o fluxo de doação define timeout (20s). Todos os demais consumidores do `Asaas`/`API` rodam **sem timeout**. Com Octane/Swoole e `--workers=2`, duas chamadas penduradas ao Asaas travam o processo inteiro — DoS por exaustão de worker. Não há retry/backoff em nenhum ponto. | Timeout padrão na classe base (`protected ?int $timeout = 10;` + `connectTimeout(5)`), sobrescrito por instância quando necessário; `->retry(2, 200, throw: false)` apenas em verbos idempotentes (GET de status/QR code) — **nunca** no `POST /payments`. Subir `--workers` para algo proporcional à CPU do plano Railway. |
| M-09 | Medium | `routes/v1/campanha.php:11-13` | Toda a defesa antibot mora no Next (Vercel BotID). A API só exige o proxy token e um throttle furável (H-01). Não há captcha, prova de trabalho nem verificação de velocidade na Laravel. Se o token vazar, não sobra nenhuma camada. | Além dos limites de H-01: exigir header `Idempotency-Key` obrigatório (custo por tentativa), aplicar atraso progressivo após recusas e considerar um segundo fator de origem (mTLS ou header assinado com timestamp + HMAC, resistente a replay). |
| M-10 | Medium | `routes/v1/campanha.php:15-17`, `app/Domains/Campanha/Services/DoacaoService.php:101-127` | O endpoint de status é **público** e, a cada 10s por doação, dispara uma chamada ao Asaas. Sem limite de tentativas por doação: um polling abandonado (ou um atacante com um id válido) gera chamadas indefinidas à API do Asaas. O IDOR em si é aceitável — retorna só `{id, status, pago}` e o id é UUID v4 (sem enumeração) — mas um id vazado (URL compartilhada, histórico do navegador) revela **se aquela doação foi paga**. | Teto de reconsultas por doação (ex.: para de consultar o Asaas após 40 tentativas ou 30 min da criação, respondendo só o banco) e throttle do status chaveado por `doacao_id`, não por IP (que hoje é global — H-02). Opcionalmente exigir um token curto de leitura devolvido no 201, em vez de expor status por id puro. |
| M-11 | Medium | `routes/web.php:25`, `routes/v1/landing-page.php:34-35` | Aplicar `ValidateAsaasWebhook` (agora fail-closed) às 2 rotas antigas é correto do ponto de vista de segurança, mas **muda o comportamento de produção**: se o `asaas-access-token` não estiver cadastrado no painel do Asaas exatamente igual ao `ASAAS_WEBHOOK_TOKEN`, inscrições, rifa e loja param de ser confirmadas (401) — e o Asaas desativa a fila de webhooks após sequências de falha. | Ver "Riscos operacionais do deploy". Cadastrar o token no painel **antes** do deploy e validar com um evento de teste em cada uma das 3 filas. |
| M-12 | Medium | `.env.example:75-77`, `.env.railway.example:100-105` | Nenhum dos dois arquivos documenta `CAMPANHA_PROXY_TOKEN` nem `ASAAS_WEBHOOK_TOKEN`. Deploy sem essas variáveis = 403 em toda doação e 401 em todo webhook, com falha silenciosa do ponto de vista do operador. | Acrescentar as duas chaves (vazias) nos dois exemplos, com comentário indicando o gerador (`openssl rand -hex 32`) e que o valor do webhook precisa ser colado no painel do Asaas. |

### Low

| ID | Sev | file:line | Problema | Correção |
|---|---|---|---|---|
| L-01 | Low | `app/Domains/Campanha/Requests/StoreDoacaoRequest.php:16-18` | `nome` e `email` sem `max`; `cpf_cnpj` sem `max`. Strings longas viram `QueryException` (500) em vez de 422. | `'nome' => ['required','string','min:3','max:120']`, `'email' => ['required','email:rfc','max:180']`, `'cpf_cnpj' => ['required','string','max:20', new CpfCnpj]`. |
| L-02 | Low | `StoreDoacaoRequest.php:15` | `valor` é `numeric` sem restrição de casas decimais; a spec pede 2. `10.00001` passa e vai para o Asaas. | `'valor' => ['required','numeric','min:10','max:100000','decimal:0,2']`. |
| L-03 | Low | `StoreDoacaoRequest.php:19,22-29` | `telefone`, `cartao.*` e `endereco.*` são `string` sem formato. `cartao.numero` sem Luhn/tamanho, `cvv` sem 3-4 dígitos, `cep` sem 8 dígitos, `mes`/`ano` sem faixa. O front valida, mas a API é a fonte de verdade — dados inválidos viram chamada desperdiçada ao Asaas (custo + ruído de antifraude). | Regras de formato server-side: `'telefone' => [...,'regex:/^\d{10,11}$/']`, `'cartao.numero' => [...,'regex:/^\d{13,19}$/']`, `'cartao.cvv' => [...,'regex:/^\d{3,4}$/']`, `'cartao.mes' => [...,'regex:/^(0[1-9]\|1[0-2])$/']`, `'endereco.cep' => [...,'regex:/^\d{8}$/']`. **Não** usar mensagens que ecoem o valor. |
| L-04 | Low | `routes/v1/campanha.php:8` | `middleware('guest')` em rotas públicas de API é ruído: `RedirectIfAuthenticated` está com o corpo **inteiro comentado** (`app/Http/Middleware/RedirectIfAuthenticated.php:20-29`), é um no-op. Dá falsa sensação de controle de acesso. | Remover o `->middleware('guest')` do grupo. |
| L-05 | Low | `routes/v1/campanha-webhook.php:3`, `app/Domains/Campanha/Controllers/AsaasWebhookDoacaoController.php:3`, vs `app/Domains/Campanha/Controllers/DoacaoController.php:3` | Namespaces inconsistentes no mesmo diretório: webhook usa `App\Domains\Campanha\...`, o resto usa `Domains\Campanha\...`. O `composer.json` mapeia os dois prefixos para `app/Domains`, então funciona — mas permite duas instâncias de classes "iguais" e confunde ferramentas de análise. | Padronizar em `Domains\Campanha\...` (como o restante do domínio) e ajustar os `use`. |
| L-06 | Low | `app/Domains/Campanha/Services/WebhookDoacaoService.php:19` | `PAYMENT_CHARGEBACK_REVERSAL`, `PAYMENT_REFUND_IN_PROGRESS` e `PAYMENT_AWAITING_RISK_ANALYSIS` não são tratados: um chargeback revertido fica marcado como `estornado` para sempre e sai da soma do contador indevidamente. | Mapear `PAYMENT_CHARGEBACK_REVERSAL` -> volta para `pago`; tratar `PAYMENT_REFUND_IN_PROGRESS` como informativo. |
| L-07 | Low | `app/Domains/Campanha/Services/WebhookDoacaoService.php:54-64` | O `Log::info` de sucesso roda **também** quando o evento foi duplicado (unique violation suprimida). Não existe log de erro para eventos suprimidos nem para payload inválido (`:39-41` retorna silencioso). Cegueira de detecção (OWASP A09). | Mover o log para dentro do `try` e acrescentar `Log::warning('Webhook duplicado', ['event_id' => $eventId])` no catch, e `Log::warning('Webhook sem id/event')` no early-return. Continuar logando só `event_id`, `tipo` e `payment_id` (o que já está correto). |
| L-08 | Low | `app/Http/Middleware/VerifyCampanhaProxyToken.php:23,29`, `app/Http/Middleware/ValidateAsaasWebhook.php:27` | Nenhuma rejeição é registrada. 403 de proxy token e 401 de webhook são exatamente os eventos que indicam ataque em curso ou token desalinhado, e passam invisíveis. | `Log::warning('campanha.proxy_token_rejeitado', ['ip' => $request->ip(), 'path' => $request->path()])` — **sem** corpo e sem o token recebido. Idem para o webhook. Alerta se a taxa passar de N/min. |
| L-09 | Low | `app/Domains/Campanha/Services/DoacaoService.php:200-202` | `criarAssinatura` detecta falha por `isset($assinatura['errors'])` sobre o `->json()`, não pelo status HTTP. Um 5xx que devolva HTML/vazio passa como sucesso e o código segue com `$assinatura['id']` indefinido -> 500. | Usar o mesmo padrão de `criarCobrancaComResposta`: adicionar `criarAssinaturaComResposta` e checar `$response->failed()`. |
| L-10 | Low | `app/Domains/Campanha/Services/DoacaoService.php:351` | `expira_em` é repassado cru do Asaas; a pendência M-04 do front pede ISO 8601 com offset. | `Carbon::parse($qr['expirationDate'])->toIso8601String()` com guarda para null. |

### Info

| ID | file:line | Observação |
|---|---|---|
| I-01 | `app/Domains/Campanha/**` | Zero SQL raw: nenhum `whereRaw`, `DB::raw`, `selectRaw` ou `DB::statement` no domínio. Todas as consultas passam por Eloquent com bindings. Injeção SQL: não encontrada. |
| I-02 | `Dockerfile:122` | `php artisan migrate --force` no `CMD`, com múltiplos workers/réplicas, pode disparar migrations concorrentes. Sem impacto de segurança direto, mas é um risco de corrupção de schema em scale-out. |

---

## O que está correto (não mexer)

- **Cartão nunca persistido.** A migration `create_doacoes_table` só tem `cartao_final` (4) e `cartao_bandeira` (20);
  `$fillable` do `Doacao` não contém nenhum campo de cartão; `DoacaoService.php:301-302` grava exclusivamente o que o
  Asaas devolve (`creditCardNumber` = últimos 4, `creditCardBrand`).
- **Cartão nunca logado pelo código da aplicação.** Nenhum `Log::`, `dd`, `dump`, `logger()` ou `var_dump` em
  `app/Domains/Campanha/**`. O único log do domínio (`WebhookDoacaoService.php:60-64`) registra apenas `event_id`,
  `tipo` e `payment_id` — exatamente o que a spec manda. (O vazamento de C-01 vem do Telescope, não do código.)
- **Cartão nunca retornado.** A resposta do 201 só carrega `final` e `bandeira` (`DoacaoService.php:332-338`).
- **Erros genéricos.** `CartaoRecusadoException` e `AsaasIndisponivelException` têm mensagens fixas em português,
  sem eco do corpo do Asaas e sem eco de dados do doador. O 402 e o 502 do contrato não vazam detalhe interno.
- **Sem mass-assignment.** `Doacao::create` monta o array campo a campo (`DoacaoService.php:47-59`), e o
  `StoreDoacaoRequest` + `validated()` já descartariam chaves extras. A pendência L-02 do audit do front está resolvida.
- **`$hidden` correto** em `Doacao`: `cpf_cnpj`, `remote_ip`, `idempotency_key` fora de `toArray()/toJson()`.
  `idempotency_key` de fato não aparece na resposta (AC-D11).
- **`hash_equals` e falha fechada** nos dois middlewares, inclusive com token não configurado (`VerifyCampanhaProxyToken.php:22`,
  `ValidateAsaasWebhook.php:26`). Comparação de tempo constante, sem short-circuit por tamanho.
- **Idempotência do webhook resistente a corrida**: `INSERT` do `event_id` com `unique` **dentro** da transação que
  aplica o efeito (`WebhookDoacaoService.php:44-58`) — duas entregas simultâneas do mesmo evento produzem uma violação
  `23505` e rollback do efeito. É a implementação certa; comparar-e-inserir em dois passos seria a errada.
- **Sem enumeração de doações**: id é UUID v4; `status()` filtra por `campanha_id` **e** `id` antes do `firstOrFail`
  (`DoacaoService.php:87`), então um id de outra campanha dá 404 (AC-S2).
- **Pagamento desconhecido não causa efeito colateral** (`WebhookDoacaoService.php:121-123`): eventos da rifa/loja/inscrição
  que caiam nessa rota são ignorados.
- **Validação de CPF/CNPJ por dígito verificador** (`Rules/CpfCnpj.php`), rejeitando repetidos e tamanho errado.
- **Timeout no fluxo de doação** (20s) deliberadamente menor que o do proxy (25s), o que garante que o 502 seja nosso
  e controlado, e não um timeout cru da Vercel.
- **`.env` ignorado** no git (`.gitignore:8,46`) e `.env.railway.example` já define `APP_DEBUG=false` e
  `TELESCOPE_ENABLED=false` — a base está certa, falta apenas garantir que está aplicada (ver riscos operacionais).
- **Octane/estado compartilhado**: nenhum `singleton()` registrado para `Asaas`, `DoacaoService` ou `WebhookDoacaoService`,
  e `config/octane.php` não os coloca em `warm`. `DoacaoService` só guarda o cliente `Asaas` (readonly) e o timeout;
  **nenhum dado do doador vira propriedade de objeto**. Não há vazamento entre requisições. Atenção futura: `Asaas`
  mantém headers mutáveis por instância (`Asaas.php:135` troca o `access_token` em `statusSubConta`) — hoje é inofensivo
  porque a instância é resolvida por requisição, mas **não registre `Asaas` como singleton** sem antes tornar os headers
  imutáveis por chamada.

---

## Riscos operacionais do deploy

1. **Telescope (C-01) é bloqueante.** Não subir o fluxo de cartão em produção antes de: `TELESCOPE_ENABLED=false`
   cravado nas variáveis do Railway, `enabled` com default `false` no config, `ignore_paths` cobrindo
   `api/campanhas/*/doacoes`, e `telescope:clear` executado se a API já recebeu tráfego real. O default `true` do
   config é a armadilha: basta esquecer a variável no Railway para gravar cartão em claro.

2. **As 2 rotas antigas de webhook passam a exigir token (M-11).** Ordem obrigatória:
   (a) gerar `ASAAS_WEBHOOK_TOKEN` (`openssl rand -hex 32`); (b) cadastrar o **mesmo** valor no painel do Asaas em
   **todas** as filas de webhook (inscrições, rifa/loja, doações); (c) só então fazer o deploy. Se inverter a ordem,
   inscrições e rifa param de ser confirmadas — e o Asaas **desativa a fila** após uma sequência de respostas de erro,
   exigindo reativação manual e reenvio dos eventos acumulados. Ter à mão o procedimento de reprocessamento.

3. **Variáveis novas não documentadas (M-12).** `CAMPANHA_PROXY_TOKEN` (>= 32 chars, idêntico ao da Vercel) e
   `ASAAS_WEBHOOK_TOKEN` precisam existir no Railway antes do deploy. Sem a primeira, **toda** doação responde 403 com
   uma mensagem que parece erro do front. Adicionar as duas ao `.env.railway.example`.

4. **`TrustProxies` (H-02) muda números de throttle.** Corrigir para `$proxies = '*'` faz os limites, que hoje são
   globais por acidente, passarem a valer por IP real. Depois da mudança, revalidar o limite global `api` (60/min) com
   o tráfego esperado da campanha — sem essa revisão, a correção troca um problema por outro.

5. **`config:cache` quebra o Asaas (M-01).** Enquanto `Asaas.php` usar `env()`, **não** habilitar `php artisan optimize`
   ou `config:cache` no `Dockerfile`/`release command`. Isso é uma otimização natural que alguém vai tentar aplicar:
   documentar ou, melhor, corrigir o `env()` antes.

6. **`--workers=2` + chamadas sem timeout (M-08).** Uma lentidão do Asaas em qualquer domínio (rifa, inscrição, loja)
   pendura os dois workers Swoole e derruba a API inteira, inclusive as doações. Timeout padrão na classe base antes
   da campanha entrar no ar.

7. **`migrate --force` no `CMD` (I-02).** Com réplica ou restart simultâneo, duas instâncias podem migrar em paralelo.
   Mover para um release command único ou proteger com lock antes de escalar.

8. **Monitoramento mínimo para a janela da campanha.** Alertar em: taxa de 402 (card-testing), taxa de 403 do proxy
   token e 401 do webhook (L-08), 502 do Asaas, e divergência entre `SUM(doacao_pagamentos pagos)` e o extrato do Asaas
   filtrado por `externalReference` (detecta H-03). Sem isso, uma cobrança perdida só aparece quando o doador reclamar.
