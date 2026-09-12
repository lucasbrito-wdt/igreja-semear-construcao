/** Mascaras de exibicao do bloco de cartao — validacao real fica em src/lib/validation/card.ts. */

import type { CardBrand } from "@/lib/validation/card";

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  elo: "Elo",
  hipercard: "Hipercard",
  unknown: "não identificada",
};

export function brandLabel(brand: CardBrand): string {
  return BRAND_LABEL[brand];
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Agrupa o numero do cartao em blocos de 4 digitos para exibicao. */
export function formatCardNumberDisplay(digits: string): string {
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Mascara de CEP: 00000-000. */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Extrai mes/ano de uma digitacao livre de validade (MM/AA). */
export function parseValidadeInput(texto: string): { mes: string; ano: string } {
  const digits = onlyDigits(texto).slice(0, 4);
  return { mes: digits.slice(0, 2), ano: digits.slice(2, 4) };
}

/** Formata mes/ano armazenados de volta para exibicao "MM/AA". */
export function formatValidadeDisplay(mes: string, ano: string): string {
  if (mes.length < 2) return mes;
  return ano ? `${mes}/${ano}` : `${mes}/`;
}
