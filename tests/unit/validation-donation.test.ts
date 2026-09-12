import { describe, expect, it } from "vitest";
import {
  toApiPayload,
  validateDonation,
  type DonationForm,
} from "@/lib/validation/donation";

const BASE_PIX: DonationForm = {
  frequencia: "unica",
  metodo: "pix",
  valor: 50,
  nome: "Fulano de Tal",
  email: "fulano@example.com",
  cpfCnpj: "123.456.781-43",
  telefone: "11987654321",
  recibo: false,
};

const CARTAO_VALIDO: DonationForm["cartao"] = {
  titular: "Fulano de Tal",
  numero: "4111111111111111",
  mes: "06",
  ano: "2026",
  cvv: "123",
};

const ENDERECO_VALIDO: DonationForm["endereco"] = {
  cep: "01310100",
  numero: "100",
};

const AGORA = new Date(2026, 5, 15); // 15 de junho de 2026

describe("AC-F7 validateDonation rejeita valor, email, nome e cpfCnpj inválidos", () => {
  it.each([
    [{ ...BASE_PIX, valor: 9 }, "valor"],
    [{ ...BASE_PIX, valor: 100001 }, "valor"],
    [{ ...BASE_PIX, email: "nao-e-email" }, "email"],
    [{ ...BASE_PIX, nome: "" }, "nome"],
    [{ ...BASE_PIX, nome: "Fulano" }, "nome"],
    [{ ...BASE_PIX, cpfCnpj: "123.456.781-00" }, "cpfCnpj"],
  ])("marca erro em %s para o formulário dado", (form, campoEsperado) => {
    const resultado = validateDonation(form as DonationForm, AGORA);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errors[campoEsperado as keyof typeof resultado.errors]).toBeTruthy();
    }
  });

  it("nome vazio ou com uma palavra usa a mensagem 'Informe nome e sobrenome'", () => {
    const resultado = validateDonation({ ...BASE_PIX, nome: "Fulano" }, AGORA);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errors.nome).toBe("Informe nome e sobrenome");
    }
  });
});

describe("AC-F8 validateDonation exige telefone, cartão e endereço só quando metodo é cartao", () => {
  it("metodo cartao sem telefone válido, sem cartao e sem endereco reporta todos os erros", () => {
    const form: DonationForm = {
      ...BASE_PIX,
      metodo: "cartao",
      telefone: "123",
    };
    const resultado = validateDonation(form, AGORA);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errors.telefone).toBeTruthy();
      expect(resultado.errors["cartao.titular"]).toBeTruthy();
      expect(resultado.errors["cartao.numero"]).toBeTruthy();
      expect(resultado.errors["cartao.validade"]).toBeTruthy();
      expect(resultado.errors["cartao.cvv"]).toBeTruthy();
      expect(resultado.errors["endereco.cep"]).toBeTruthy();
      expect(resultado.errors["endereco.numero"]).toBeTruthy();
    }
  });

  it("metodo cartao com todos os campos válidos é aceito", () => {
    const form: DonationForm = {
      ...BASE_PIX,
      metodo: "cartao",
      telefone: "11987654321",
      cartao: CARTAO_VALIDO,
      endereco: ENDERECO_VALIDO,
    };
    expect(validateDonation(form, AGORA)).toEqual({ ok: true });
  });

  it("metodo cartao com validade vencida reporta erro em cartao.validade", () => {
    const form: DonationForm = {
      ...BASE_PIX,
      metodo: "cartao",
      telefone: "11987654321",
      cartao: { ...CARTAO_VALIDO, mes: "01", ano: "2020" },
      endereco: ENDERECO_VALIDO,
    };
    const resultado = validateDonation(form, AGORA);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.errors["cartao.validade"]).toBeTruthy();
    }
  });

  it("metodo pix ou boleto ignora campos de cartão mesmo que preenchidos inválidos", () => {
    const form: DonationForm = {
      ...BASE_PIX,
      metodo: "pix",
      cartao: { titular: "", numero: "0000", mes: "13", ano: "2000", cvv: "1" },
      endereco: { cep: "1", numero: "" },
    };
    expect(validateDonation(form, AGORA)).toEqual({ ok: true });
  });
});

describe("AC-F9 toApiPayload monta o body snake_case do contrato", () => {
  it("para pix omite cartao e endereco e normaliza documentos", () => {
    const payload = toApiPayload(BASE_PIX) as Record<string, unknown>;
    expect(payload).toMatchObject({
      frequencia: "unica",
      metodo: "pix",
      valor: 50,
      nome: "Fulano de Tal",
      email: "fulano@example.com",
      cpf_cnpj: "12345678143",
      telefone: "11987654321",
      recibo: false,
    });
    expect(payload).not.toHaveProperty("cartao");
    expect(payload).not.toHaveProperty("endereco");
  });

  it("para cartao inclui cartao e endereco normalizados com ano de 4 dígitos", () => {
    const form: DonationForm = {
      ...BASE_PIX,
      metodo: "cartao",
      telefone: "(11) 98765-4321",
      valor: 123.456,
      cartao: { ...CARTAO_VALIDO, ano: "26" },
      endereco: { cep: "01310-100", numero: "100" },
    };
    const payload = toApiPayload(form) as Record<string, unknown>;
    expect(payload).toMatchObject({
      telefone: "11987654321",
      valor: 123.46,
      cartao: {
        titular: "Fulano de Tal",
        numero: "4111111111111111",
        mes: "06",
        ano: "2026",
        cvv: "123",
      },
      endereco: { cep: "01310100", numero: "100" },
    });
  });
});
