import { describe, expect, it } from "vitest";
import { detectBrand, isExpiryValid, luhn } from "@/lib/validation/card";

describe("AC-F4 luhn aceita números de teste públicos e rejeita alterados", () => {
  it.each([
    ["4111111111111111", true], // Visa
    ["5555555555554444", true], // Mastercard
    ["378282246310005", true], // Amex
    ["4111111111111112", false], // Visa com último dígito alterado
    ["5555555555554443", false], // Mastercard com último dígito alterado
    ["378282246310006", false], // Amex com último dígito alterado
  ])("luhn(%s) deve ser %s", (numero, esperado) => {
    expect(luhn(numero)).toBe(esperado);
  });
});

describe("AC-F5 detectBrand identifica a bandeira pelo prefixo", () => {
  it.each([
    ["4111111111111111", "visa"],
    ["5105105105105100", "mastercard"], // faixa 51-55
    ["2221000000000009", "mastercard"], // faixa 2221-2720
    ["340000000000009", "amex"], // prefixo 34
    ["378282246310005", "amex"], // prefixo 37
    ["6363680000000000", "elo"], // prefixo 636368
    ["4389350000000000", "elo"], // prefixo 438935
    ["5041750000000000", "elo"], // prefixo 504175
    ["4514160000000000", "elo"], // prefixo 451416
    ["5090000000000000", "elo"], // prefixo 509
    ["6062820000000000", "hipercard"], // prefixo 606282
    ["3841000000000000", "hipercard"], // prefixo 3841
    ["9999999999999999", "unknown"],
  ])("detectBrand(%s) deve ser %s", (numero, esperado) => {
    expect(detectBrand(numero)).toBe(esperado);
  });
});

describe("AC-F6 isExpiryValid com now fixo", () => {
  const now = new Date(2026, 5, 15); // 15 de junho de 2026

  it.each([
    ["06", "2026", true], // mês corrente é válido
    ["05", "2026", false], // mês passado é inválido
    ["06", "26", true], // ano com 2 dígitos
    ["13", "2026", false], // mês inválido
    ["07", "2026", true], // mês futuro
  ])("isExpiryValid(%s, %s) deve ser %s", (mes, ano, esperado) => {
    expect(isExpiryValid(mes, ano, now)).toBe(esperado);
  });
});
