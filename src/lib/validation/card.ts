/**
 * Validacao de cartao: algoritmo de Luhn, deteccao de bandeira por prefixo
 * e validade mes/ano com "now" injetavel para teste.
 */

import { onlyDigits } from "./documents";

export type CardBrand = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "unknown";

export function luhn(numero: string): boolean {
  const digits = onlyDigits(numero);
  if (digits.length === 0) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Prefixos de BIN (Bank Identification Number) publicamente conhecidos das
// bandeiras Elo e Hipercard. Lista não exaustiva: cobre os ranges usados nos
// cenarios de teste deste projeto; novos prefixos publicados pelas bandeiras
// devem ser adicionados aqui.
const ELO_PREFIXES = ["636368", "438935", "504175", "451416", "509"];
const HIPERCARD_PREFIXES = ["606282", "3841"];

export function detectBrand(numero: string): CardBrand {
  const digits = onlyDigits(numero);

  if (ELO_PREFIXES.some((prefix) => digits.startsWith(prefix))) return "elo";
  if (HIPERCARD_PREFIXES.some((prefix) => digits.startsWith(prefix))) return "hipercard";

  // Amex: prefixos oficiais 34 e 37.
  if (/^3[47]/.test(digits)) return "amex";

  // Mastercard: range historico 51-55 e o range estendido 2221-2720
  // (extensao de BIN publicada pela bandeira em 2016).
  const twoDigitPrefix = Number(digits.slice(0, 2));
  if (twoDigitPrefix >= 51 && twoDigitPrefix <= 55) return "mastercard";

  const fourDigitPrefix = Number(digits.slice(0, 4));
  if (fourDigitPrefix >= 2221 && fourDigitPrefix <= 2720) return "mastercard";

  // Visa: qualquer numero iniciado em 4.
  if (digits.startsWith("4")) return "visa";

  return "unknown";
}

export function isExpiryValid(mes: string, ano: string, now: Date = new Date()): boolean {
  const month = Number(mes);
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;

  const yearInput = Number(ano);
  if (!Number.isInteger(yearInput)) return false;
  const year = ano.length === 2 ? yearInput + 2000 : yearInput;

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  if (year !== nowYear) return year > nowYear;
  return month >= nowMonth;
}
