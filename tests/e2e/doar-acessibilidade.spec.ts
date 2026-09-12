import { expect, test } from "@playwright/test";

// Acessibilidade básica: em /doar, cada input principal tem um label
// acessível associado (aria-label ou <label>), verificável via getByLabel.
test("cada campo principal do formulário tem label acessível", async ({ page }) => {
  await page.goto("/doar");

  await expect(page.getByLabel("Nome completo")).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(page.getByLabel("CPF ou CNPJ")).toBeVisible();
  await expect(page.getByLabel("WhatsApp (opcional)")).toBeVisible();
  await expect(page.getByLabel("Outro valor de doação")).toBeVisible();

  await page.getByTestId("metodo-cartao").click();

  await expect(page.getByLabel("WhatsApp", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Nome impresso no cartão")).toBeVisible();
  await expect(page.getByLabel("Número do cartão")).toBeVisible();
  await expect(page.getByLabel("Validade (MM/AA)")).toBeVisible();
  await expect(page.getByLabel("CVV")).toBeVisible();
  await expect(page.getByLabel("CEP")).toBeVisible();
  await expect(page.getByLabel("Número", { exact: true })).toBeVisible();
});
