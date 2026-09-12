import { expect, test } from "@playwright/test";

// AC-U2 — GIVEN método Cartão WHEN selecionado THEN campos de cartão e
// endereço aparecem; com Pix ficam ocultos. Telefone vira obrigatório.
test("AC-U2: bloco de cartão só existe com método Cartão; telefone vira obrigatório", async ({
  page,
}) => {
  await page.goto("/doar");

  // Metodo inicial e Pix: bloco de cartao nao existe no DOM.
  await expect(page.getByTestId("metodo-pix")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("bloco-cartao")).toHaveCount(0);
  await expect(page.getByTestId("campo-telefone")).toHaveAttribute(
    "aria-label",
    "WhatsApp (opcional)"
  );

  await page.getByTestId("metodo-cartao").click();

  await expect(page.getByTestId("bloco-cartao")).toBeVisible();
  await expect(page.getByTestId("campo-cartao-titular")).toBeVisible();
  await expect(page.getByTestId("campo-cartao-numero")).toBeVisible();
  await expect(page.getByTestId("campo-cartao-validade")).toBeVisible();
  await expect(page.getByTestId("campo-cartao-cvv")).toBeVisible();
  await expect(page.getByTestId("campo-endereco-cep")).toBeVisible();
  await expect(page.getByTestId("campo-endereco-numero")).toBeVisible();
  await expect(page.getByTestId("campo-telefone")).toHaveAttribute("aria-label", "WhatsApp");

  // Voltando para Pix, o bloco de cartao some de novo.
  await page.getByTestId("metodo-pix").click();
  await expect(page.getByTestId("bloco-cartao")).toHaveCount(0);
});
