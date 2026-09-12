# Spec Delta: Portal do Doador

## 1. Arquitetura de Autenticação (Magic Link / OTP via WhatsApp)
O portal não utilizará senhas para reduzir o atrito. A autenticação será baseada no `cpf_cnpj` (que identifica um doador de forma única no sistema).

- **ADDED**: Rota de requisição de login (`POST /api/doador/login`). Recebe o CPF. Gera um token criptografado temporário (válido por 15min) e armazena no Cache. Envia o link mágico via `WhatsappService` (se o CPF estiver vinculado a uma doação com telefone).
- **ADDED**: Rota de verificação do token (`POST /api/doador/auth`). Recebe o token, valida no Cache, e devolve um token de sessão longo (JWT ou Encrypted String usando `Crypt::encrypt`) contendo o CPF autenticado.
- **ADDED**: Middleware `auth.doador` que verifica o token longo no header `Authorization: Bearer <token>` e injeta o CPF no Request.

## 2. Rotas de Gestão do Doador (Backend)
- **ADDED**: `GET /api/doador/doacoes` (protegida por `auth.doador`). Retorna todas as doações (com seus respectivos `pagamentos`) associadas ao CPF autenticado.
- **ADDED**: `POST /api/doador/doacoes/{doacao}/cancelar` (protegida por `auth.doador`). Permite ao doador cancelar uma assinatura mensal. O backend irá chamar a API do Asaas (`asaas->cancelarAssinatura`) e atualizar o status da `Doacao` para `CANCELADA`.

## 3. Frontend (Next.js)
- **ADDED**: Página `/doador` (Login). Formulário solicitando apenas o CPF. Ao submeter, exibe mensagem "Link de acesso enviado para o seu WhatsApp cadastrado".
- **ADDED**: Página `/doador/auth`. Recebe o `token` via query string, faz o POST para a API, armazena o token longo no localStorage/cookies, e redireciona para o Painel.
- **ADDED**: Página `/doador/painel`. Exibe a lista de doações e assinaturas do usuário. Cada assinatura mensal ativa terá um botão vermelho "Cancelar Assinatura". Ao confirmar e cancelar, a UI atualiza.

## Critérios de Aceite (GIVEN/WHEN/THEN)
- **CA1 (Login via WhatsApp)**: GIVEN um CPF que possui doação prévia WHEN o usuário solicita acesso THEN o sistema gera um token temporário, envia o link mágico via WhatsApp usando o `WhatsappService` e retorna sucesso.
- **CA2 (Login Inválido)**: GIVEN um CPF inexistente WHEN o usuário solicita acesso THEN o sistema retorna erro 404 informando que o doador não foi encontrado.
- **CA3 (Autenticação Mágica)**: GIVEN um token de acesso válido WHEN o usuário chama a rota de auth THEN o sistema consome o token e retorna um token longo de autenticação.
- **CA4 (Listagem de Doações)**: GIVEN um doador autenticado WHEN ele acessa a listagem de doações THEN ele recebe apenas as doações atreladas ao seu CPF, com status e histórico de pagamentos.
- **CA5 (Cancelamento)**: GIVEN um doador autenticado E uma doação mensal ativa WHEN ele clica para cancelar THEN o sistema chama a API do Asaas para deletar a `subscription` E altera o status da doação localmente para `CANCELADA`.
- **CA6 (Privilégio de Cancelamento)**: GIVEN um doador autenticado WHEN ele tenta cancelar uma doação que pertence a outro CPF THEN o sistema bloqueia retornando 403 Forbidden.
