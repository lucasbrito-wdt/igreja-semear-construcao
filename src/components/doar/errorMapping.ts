/**
 * Mapeia os erros 422 do Laravel (chaves snake_case, ex.: "cpf_cnpj",
 * "cartao.numero", "endereco.cep") para as chaves de DonationErrors
 * usadas pelo formulario.
 */

import type { DonationErrors } from "@/lib/validation/donation";

const FIELD_MAP: Record<string, keyof DonationErrors> = {
  valor: "valor",
  email: "email",
  nome: "nome",
  cpf_cnpj: "cpfCnpj",
  telefone: "telefone",
  "cartao.titular": "cartao.titular",
  "cartao.numero": "cartao.numero",
  "cartao.mes": "cartao.validade",
  "cartao.ano": "cartao.validade",
  "cartao.cvv": "cartao.cvv",
  "endereco.cep": "endereco.cep",
  "endereco.numero": "endereco.numero",
};

/** Converte o objeto `errors` da resposta 422 para DonationErrors. */
export function mapApiErrors(errors: Record<string, string[]>): DonationErrors {
  const mapped: DonationErrors = {};

  for (const [field, messages] of Object.entries(errors)) {
    const key = FIELD_MAP[field];
    if (!key) continue;
    const message = messages[0];
    if (message) {
      mapped[key] = message;
    }
  }

  return mapped;
}
