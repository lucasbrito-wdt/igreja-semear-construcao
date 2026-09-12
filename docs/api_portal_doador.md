# API Contract: Portal do Doador

Este documento define o contrato da API para o Portal do Doador, focado em permitir autenticação sem senha (via Magic Link enviado por WhatsApp) e autogestão de doações pelo doador.

Todas as respostas de erro seguem o padrão JSON com uma mensagem descritiva (e eventuais detalhes de validação), e endpoints de listagem são paginados por padrão.

---

## 1. Autenticação

A autenticação é realizada em duas etapas: solicitação do link mágico usando o CPF/CNPJ e validação do token contido no link.

### 1.1. Solicitar Login (Magic Link)

Recebe o CPF ou CNPJ do doador. Se encontrado na base de doações, gera um token temporário, envia-o via WhatsApp e retorna sucesso.

- **Endpoint:** `POST /api/doador/login`
- **Auth Requerida:** Não

**Request Body:**
```json
{
  "cpf_cnpj": "12345678901"
}
```

**Responses:**

- `200 OK` - Sucesso
  ```json
  {
    "message": "Link de acesso enviado para o seu WhatsApp cadastrado."
  }
  ```

- `404 Not Found` - Doador não possui registros no sistema (CA2)
  ```json
  {
    "message": "Doador não encontrado."
  }
  ```

- `422 Unprocessable Entity` - Erro de validação da requisição
  ```json
  {
    "message": "O campo cpf_cnpj é obrigatório.",
    "errors": {
      "cpf_cnpj": ["O campo cpf_cnpj é obrigatório."]
    }
  }
  ```

---

### 1.2. Validar Token de Acesso

Recebe o token mágico temporário gerado na etapa anterior, valida sua existência no cache, o revoga e retorna um token de sessão de longa duração.

- **Endpoint:** `POST /api/doador/auth`
- **Auth Requerida:** Não

**Request Body:**
```json
{
  "token": "abc123def4567890..."
}
```

**Responses:**

- `200 OK` - Sucesso (CA3)
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "token_type": "Bearer"
  }
  ```

- `401 Unauthorized` - Token inválido, inexistente ou já expirado
  ```json
  {
    "message": "Token inválido ou expirado."
  }
  ```

- `422 Unprocessable Entity` - Erro de validação
  ```json
  {
    "message": "O campo token é obrigatório.",
    "errors": {
      "token": ["O campo token é obrigatório."]
    }
  }
  ```

---

## 2. Gestão de Doações

Todas as rotas desta seção são protegidas e exigem o envio do token de sessão no cabeçalho HTTP:
`Authorization: Bearer <access_token>`

### 2.1. Listar Doações do Usuário

Lista as doações associadas exclusivamente ao CPF/CNPJ do doador autenticado, juntamente com o histórico de pagamentos atrelado. Retorna uma coleção paginada.

- **Endpoint:** `GET /api/doador/doacoes`
- **Auth Requerida:** Sim (`auth.doador`)

**Query Parameters:**
- `page` (opcional, default 1)
- `per_page` (opcional, default 15)

**Responses:**

- `200 OK` - Sucesso (CA4)
  ```json
  {
    "data": [
      {
        "id": 123,
        "tipo": "mensal",
        "valor": 50.00,
        "status": "ATIVA",
        "data_criacao": "2023-01-10T10:00:00Z",
        "pagamentos": [
          {
            "id": 456,
            "valor": 50.00,
            "status": "PAGO",
            "data_vencimento": "2023-01-10",
            "data_pagamento": "2023-01-10T10:05:00Z",
            "forma_pagamento": "PIX"
          }
        ]
      }
    ],
    "meta": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1
    }
  }
  ```

- `401 Unauthorized` - Doador não autenticado
  ```json
  {
    "message": "Não autenticado."
  }
  ```

---

### 2.2. Cancelar Assinatura (Doação Mensal)

Solicita o cancelamento de uma assinatura recorrente ativa. Esta operação deve atualizar o sistema de pagamentos externo (Asaas) e refletir o cancelamento no banco de dados local.

*Nota REST: Apesar de ações idealmente serem representadas via PATCH no recurso (ex: alterando status para CANCELADA), a estrutura `POST /{id}/cancelar` é comumente aceita em contextos RPC ou quando uma ação de negócio despacha efeitos colaterais complexos.*

- **Endpoint:** `POST /api/doador/doacoes/{doacao_id}/cancelar`
- **Auth Requerida:** Sim (`auth.doador`)

**Path Parameters:**
- `doacao_id` (int): O ID numérico da doação a ser cancelada.

**Responses:**

- `200 OK` - Sucesso no cancelamento (CA5)
  ```json
  {
    "message": "Assinatura cancelada com sucesso.",
    "doacao": {
      "id": 123,
      "status": "CANCELADA"
    }
  }
  ```

- `403 Forbidden` - Tentativa de cancelar uma doação pertencente a outro CPF (CA6)
  ```json
  {
    "message": "Acesso não autorizado a esta doação."
  }
  ```

- `404 Not Found` - Doação inexistente
  ```json
  {
    "message": "Doação não encontrada."
  }
  ```

- `422 Unprocessable Entity` - A doação não é passível de cancelamento (ex: já está cancelada, ou é doação única)
  ```json
  {
    "message": "Apenas assinaturas mensais ativas podem ser canceladas."
  }
  ```
