import { expect, test } from "@playwright/test";

import {
  doacaoId,
  mockDoacoesPostOnce,
  mockStatusSequence,
  pixResponseBody,
  preencherDadosBasicos,
} from "./support/donation";

// AC-U1 — GIVEN Pix WHEN confirma THEN ve QR e copiar; quando status vira
// pago, ve "Obrigado, {nome}".
test("AC-U1: doação Pix confirma, mostra QR e copiar, e conclui em Obrigado com o nome", async ({
  page,
}) => {
  const id = doacaoId();

  await mockDoacoesPostOnce(page, 201, pixResponseBody());
  await mockStatusSequence(page, id, [
    { status: "pendente", pago: false },
    { status: "pago", pago: true },
  ]);

  await page.goto("/doar");

  await page.getByTestId("valor-100").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("metodo-pix").click();
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-pix")).toBeVisible();
  await expect(page.getByTestId("pix-qr")).toBeVisible();

  const botaoCopiar = page.getByTestId("pix-copiar");
  await expect(botaoCopiar).toBeVisible();
  await botaoCopiar.click();
  await expect(botaoCopiar).toHaveText("Copiado");

  await expect(page.getByTestId("tela-obrigado")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("tela-obrigado")).toContainText("Obrigado, Maria.");
});
