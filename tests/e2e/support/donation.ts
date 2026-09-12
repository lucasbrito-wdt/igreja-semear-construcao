/**
 * Helpers compartilhados pelos specs de /doar: dados de doador validos,
 * preenchimento de campos e mocks das rotas de proxy Next (nunca a API
 * Laravel real — ver docs/spec-delta.md secao "Contrato do proxy Next").
 */

import type { Page, Route } from "@playwright/test";

/** CPF de teste com digito verificador correto (529.982.247-25). */
export const VALID_CPF = "529.982.247-25";

/** Numero de cartao de teste publico, Luhn-valido (Visa). */
export const VALID_CARD_NUMBER = "4111111111111111";

export const DEFAULT_DONOR = {
  nome: "Maria Oliveira",
  email: "maria.oliveira@example.com",
  cpf: VALID_CPF,
  telefone: "11987654321",
};

export async function preencherDadosBasicos(
  page: Page,
  overrides: Partial<typeof DEFAULT_DONOR> = {}
): Promise<void> {
  const donor = { ...DEFAULT_DONOR, ...overrides };
  await page.getByTestId("campo-nome").fill(donor.nome);
  await page.getByTestId("campo-email").fill(donor.email);
  await page.getByTestId("campo-cpf-cnpj").fill(donor.cpf);
  await page.getByTestId("campo-telefone").fill(donor.telefone);
}

export async function preencherCartaoValido(page: Page): Promise<void> {
  await page.getByTestId("campo-cartao-titular").fill("MARIA OLIVEIRA");
  await page.getByTestId("campo-cartao-numero").fill(VALID_CARD_NUMBER);
  await page.getByTestId("campo-cartao-validade").fill("12/30");
  await page.getByTestId("campo-cartao-cvv").fill("123");
  await page.getByTestId("campo-endereco-cep").fill("01310-100");
  await page.getByTestId("campo-endereco-numero").fill("100");
}

const DOACAO_ID = "11111111-1111-4111-8111-111111111111";
// PNG 1x1 transparente — so precisa ser um base64 valido para o <img>.
const QR_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export function pixResponseBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: DOACAO_ID,
    status: "pendente",
    frequencia: "unica",
    metodo: "pix",
    valor: 100,
    pix: {
      qr_code_base64: QR_BASE64,
      copia_e_cola: "00020126360014BR.GOV.BCB.PIX0114+55119876543215204000053039865405100.005802BR",
      expira_em: new Date(Date.now() + 15 * 60_000).toISOString(),
    },
    ...overrides,
  };
}

export function boletoResponseBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    status: "pendente",
    frequencia: "unica",
    metodo: "boleto",
    valor: 250,
    boleto: {
      url: "https://boleto.example.com/22222222.pdf",
      linha_digitavel: "34191.79001 01043.510047 91020.150008 1 84770026000",
      vencimento: "2026-09-20",
    },
    ...overrides,
  };
}

export function cartaoAprovadoResponseBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    status: "pago",
    frequencia: "unica",
    metodo: "cartao",
    valor: 100,
    cartao: { aprovado: true, final: "1111", bandeira: "VISA" },
    ...overrides,
  };
}

export function doacaoId(): string {
  return DOACAO_ID;
}

/**
 * Intercepta POST /api/doacoes (proxy Next) e responde com o payload dado,
 * sem jamais deixar a requisicao chegar na API Laravel real.
 */
export async function mockDoacoesPost(
  page: Page,
  responder: (route: Route) => Promise<void> | void
): Promise<void> {
  await page.route("**/api/doacoes", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await responder(route);
  });
}

export async function mockDoacoesPostOnce(
  page: Page,
  status: number,
  body: unknown
): Promise<void> {
  await mockDoacoesPost(page, async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

/** Mocka GET /api/doacoes/{id}/status devolvendo, em sequencia, um corpo por chamada. */
export async function mockStatusSequence(
  page: Page,
  id: string,
  bodies: Array<{ status: string; pago: boolean }>
): Promise<void> {
  let chamada = 0;
  await page.route(`**/api/doacoes/${id}/status`, async (route) => {
    const indice = Math.min(chamada, bodies.length - 1);
    const corpo = bodies[indice];
    chamada += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id, ...corpo }),
    });
  });
}
