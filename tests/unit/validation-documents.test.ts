import { describe, expect, it } from "vitest";
import {
  formatCpfCnpj,
  isValidCnpj,
  isValidCpf,
  isValidCpfCnpj,
} from "@/lib/validation/documents";

describe("AC-F1 CPF válido é aceito e inválido é rejeitado", () => {
  it.each([
    ["123.456.781-43", true],
    ["12345678143", true],
    ["987.654.321-00", true],
    ["98765432100", true],
    ["123.456.781-00", false], // DV errado
    ["111.111.111-11", false], // todos dígitos iguais
    ["1234567814", false], // tamanho errado (10 dígitos)
    ["123456781433", false], // tamanho errado (12 dígitos)
  ])("isValidCpf(%s) deve ser %s", (cpf, esperado) => {
    expect(isValidCpf(cpf)).toBe(esperado);
  });
});

describe("AC-F2 CNPJ válido é aceito e inválido é rejeitado; isValidCpfCnpj roteia por tamanho", () => {
  it.each([
    ["32.703.146/0001-90", true],
    ["32703146000190", true],
    ["11.122.233/0001-83", true],
    ["11122233000183", true],
    ["32.703.146/0001-91", false], // DV errado
    ["11.111.111/1111-11", false], // todos dígitos iguais
    ["3270314600019", false], // tamanho errado (13 dígitos)
  ])("isValidCnpj(%s) deve ser %s", (cnpj, esperado) => {
    expect(isValidCnpj(cnpj)).toBe(esperado);
  });

  it("isValidCpfCnpj roteia CPF (11 dígitos) e CNPJ (14 dígitos) para o validador correto", () => {
    expect(isValidCpfCnpj("123.456.781-43")).toBe(true);
    expect(isValidCpfCnpj("32.703.146/0001-90")).toBe(true);
    expect(isValidCpfCnpj("123.456.781-00")).toBe(false);
    expect(isValidCpfCnpj("32.703.146/0001-91")).toBe(false);
    expect(isValidCpfCnpj("123")).toBe(false);
  });
});

describe("AC-F3 formatCpfCnpj aplica máscara progressiva", () => {
  it.each([
    ["1", "1"],
    ["123", "123"],
    ["1234", "123.4"],
    ["123456781", "123.456.781"],
    ["12345678143", "123.456.781-43"],
    ["327031460001", "32.703.146/0001"],
    ["32703146000190", "32.703.146/0001-90"],
  ])("formatCpfCnpj(%s) deve retornar %s", (entrada, esperado) => {
    expect(formatCpfCnpj(entrada)).toBe(esperado);
  });
});
