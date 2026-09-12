import { expect, test } from "@playwright/test";

import {
  boletoResponseBody,
  mockDoacoesPostOnce,
  preencherCartaoValido,
  preencherDadosBasicos,
} from "./support/donation";

test("boleto: 201 com boleto.url e linha_digitavel mostra tela-boleto", async ({ page }) => {
  await mockDoacoesPostOnce(page, 201, boletoResponseBody());

  await page.goto("/doar");
  await page.getByTestId("valor-250").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("metodo-boleto").click();
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-boleto")).toBeVisible();
  await expect(page.getByText("Seu boleto foi gerado")).toBeVisible();
  await expect(page.getByText("34191.79001 01043.510047 91020.150008 1 84770026000")).toBeVisible();
});

test("cartão recusado (402) mostra tela-recusado com a mensagem do provedor", async ({ page }) => {
  const mensagem = "Seu banco recusou essa cobrança. Tente outro cartão.";
  await mockDoacoesPostOnce(page, 402, { message: mensagem });

  await page.goto("/doar");
  await page.getByTestId("valor-100").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("metodo-cartao").click();
  await preencherCartaoValido(page);
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-recusado")).toBeVisible();
  await expect(page.getByTestId("tela-recusado")).toContainText(mensagem);
});

test("erro 502 do proxy (upstream fora do ar) mostra tela-erro", async ({ page }) => {
  await mockDoacoesPostOnce(page, 502, {
    message: "Não foi possível processar sua doação agora. Tente novamente em instantes.",
  });

  await page.goto("/doar");
  await page.getByTestId("valor-100").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-erro")).toBeVisible();
});

test("422 com errors.cpf_cnpj mostra a mensagem no campo certo e mantém o formulário", async ({
  page,
}) => {
  const mensagemErro = "O CPF informado não é válido perante o processador de pagamento.";
  await mockDoacoesPostOnce(page, 422, {
    message: "The given data was invalid.",
    errors: { cpf_cnpj: [mensagemErro] },
  });

  await page.goto("/doar");
  await page.getByTestId("valor-100").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("btn-confirmar").click();

  const campoCpf = page.getByTestId("campo-cpf-cnpj");
  await expect(campoCpf).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#cpfCnpj-erro")).toHaveText(mensagemErro);
  // Nao navegou para nenhuma tela de resultado: continua no formulario.
  await expect(page.getByTestId("btn-confirmar")).toBeVisible();
});
