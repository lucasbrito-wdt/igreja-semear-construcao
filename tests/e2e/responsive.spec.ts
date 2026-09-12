import { expect, test, type Page } from "@playwright/test";

import {
  boletoResponseBody,
  cartaoAprovadoResponseBody,
  doacaoId,
  mockDoacoesPostOnce,
  mockStatusSequence,
  pixResponseBody,
  preencherCartaoValido,
  preencherDadosBasicos,
} from "./support/donation";

async function assertSemScrollHorizontal(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

// AC-U5 — GIVEN viewport 390px WHEN qualquer página THEN sem scroll horizontal.
test.describe("AC-U5: sem scroll horizontal em 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home", async ({ page }) => {
    await page.goto("/");
    await assertSemScrollHorizontal(page);
  });

  test("/doar — formulário", async ({ page }) => {
    await page.goto("/doar");
    await page.getByTestId("metodo-cartao").click();
    await assertSemScrollHorizontal(page);
  });

  test("/doar — tela Pix", async ({ page }) => {
    const id = doacaoId();
    await mockDoacoesPostOnce(page, 201, pixResponseBody());
    await mockStatusSequence(page, id, [{ status: "pendente", pago: false }]);

    await page.goto("/doar");
    await page.getByTestId("valor-100").click();
    await preencherDadosBasicos(page);
    await page.getByTestId("btn-confirmar").click();

    await expect(page.getByTestId("tela-pix")).toBeVisible();
    await assertSemScrollHorizontal(page);
  });

  test("/doar — tela Boleto", async ({ page }) => {
    await mockDoacoesPostOnce(page, 201, boletoResponseBody());

    await page.goto("/doar");
    await page.getByTestId("valor-250").click();
    await preencherDadosBasicos(page);
    await page.getByTestId("metodo-boleto").click();
    await page.getByTestId("btn-confirmar").click();

    await expect(page.getByTestId("tela-boleto")).toBeVisible();
    await assertSemScrollHorizontal(page);
  });

  test("/doar — tela Obrigado", async ({ page }) => {
    await mockDoacoesPostOnce(page, 201, cartaoAprovadoResponseBody());

    await page.goto("/doar");
    await page.getByTestId("valor-100").click();
    await preencherDadosBasicos(page);
    await page.getByTestId("metodo-cartao").click();
    await preencherCartaoValido(page);
    await page.getByTestId("btn-confirmar").click();

    await expect(page.getByTestId("tela-obrigado")).toBeVisible();
    await assertSemScrollHorizontal(page);
  });
});
