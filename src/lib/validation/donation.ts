/**
 * Validacao do formulario de doacao e montagem do payload snake_case
 * do contrato POST /campanhas/{slug}/doacoes.
 */

import { isValidCpfCnpj, onlyDigits } from "@/lib/validation/documents";
import { isExpiryValid, luhn } from "@/lib/validation/card";

export type DonationForm = {
  frequencia: "unica" | "mensal";
  metodo: "pix" | "boleto" | "cartao";
  valor: number;
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone: string;
  recibo: boolean;
  cartao?: { titular: string; numero: string; mes: string; ano: string; cvv: string };
  endereco?: { cep: string; numero: string };
};

export type DonationErrors = Partial<{
  valor: string;
  email: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  "cartao.titular": string;
  "cartao.numero": string;
  "cartao.validade": string;
  "cartao.cvv": string;
  "endereco.cep": string;
  "endereco.numero": string;
}>;

export type ValidateDonationResult = { ok: true } | { ok: false; errors: DonationErrors };

export type ApiPayload = {
  frequencia: DonationForm["frequencia"];
  metodo: DonationForm["metodo"];
  valor: number;
  nome: string;
  email: string;
  cpf_cnpj: string;
  telefone: string;
  recibo: boolean;
  cartao?: { titular: string; numero: string; mes: string; ano: string; cvv: string };
  endereco?: { cep: string; numero: string };
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateTelefone(telefone: string, errors: DonationErrors): void {
  const telefoneDigits = onlyDigits(telefone);
  if (telefoneDigits.length < 10 || telefoneDigits.length > 11) {
    errors.telefone = "Telefone inválido";
  }
}

function validateCartaoDetalhes(
  cartao: DonationForm["cartao"],
  now: Date,
  errors: DonationErrors,
): void {
  if (!cartao || cartao.titular.trim().length === 0) {
    errors["cartao.titular"] = "Informe o titular do cartão";
  }
  if (!cartao || !luhn(cartao.numero)) {
    errors["cartao.numero"] = "Número de cartão inválido";
  }
  if (!cartao || !isExpiryValid(cartao.mes, cartao.ano, now)) {
    errors["cartao.validade"] = "Validade inválida";
  }
  if (!cartao || !/^\d{3,4}$/.test(cartao.cvv)) {
    errors["cartao.cvv"] = "CVV inválido";
  }
}

function validateEndereco(endereco: DonationForm["endereco"], errors: DonationErrors): void {
  if (!endereco || onlyDigits(endereco.cep).length !== 8) {
    errors["endereco.cep"] = "CEP inválido";
  }
  if (!endereco || endereco.numero.trim().length === 0) {
    errors["endereco.numero"] = "Número é obrigatório";
  }
}

function validateCartaoFields(form: DonationForm, now: Date, errors: DonationErrors): void {
  validateTelefone(form.telefone, errors);
  validateCartaoDetalhes(form.cartao, now, errors);
  validateEndereco(form.endereco, errors);
}

export function validateDonation(form: DonationForm, now: Date = new Date()): ValidateDonationResult {
  const errors: DonationErrors = {};

  if (!(form.valor >= 10 && form.valor <= 100000)) {
    errors.valor = "Valor deve estar entre R$ 10 e R$ 100.000";
  }

  if (!isValidEmail(form.email)) {
    errors.email = "E-mail inválido";
  }

  const nomePartes = form.nome.trim().split(/\s+/).filter(Boolean);
  if (nomePartes.length < 2) {
    errors.nome = "Informe nome e sobrenome";
  }

  if (!isValidCpfCnpj(form.cpfCnpj)) {
    errors.cpfCnpj = "CPF/CNPJ inválido";
  }

  if (form.metodo === "cartao") {
    validateCartaoFields(form, now, errors);
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

function normalizeAno(ano: string): string {
  return ano.length === 2 ? `20${ano}` : ano;
}

export function toApiPayload(form: DonationForm): ApiPayload {
  const payload: ApiPayload = {
    frequencia: form.frequencia,
    metodo: form.metodo,
    valor: Math.round(form.valor * 100) / 100,
    nome: form.nome,
    email: form.email,
    cpf_cnpj: onlyDigits(form.cpfCnpj),
    telefone: onlyDigits(form.telefone),
    recibo: form.recibo,
  };

  if (form.metodo === "cartao" && form.cartao && form.endereco) {
    payload.cartao = {
      titular: form.cartao.titular,
      numero: form.cartao.numero,
      mes: form.cartao.mes,
      ano: normalizeAno(form.cartao.ano),
      cvv: form.cartao.cvv,
    };
    payload.endereco = {
      cep: onlyDigits(form.endereco.cep),
      numero: form.endereco.numero,
    };
  }

  return payload;
}
