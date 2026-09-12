import { expect, test } from "@playwright/test";

// AC-U3 — GIVEN clique num tier WHEN na home THEN abre /doar com o valor
// pré-selecionado.
test("AC-U3: clicar num tier da home abre /doar com o valor pré-selecionado", async ({
  page,
}) => {
  await page.goto("/");

  const tierLink = page.locator('[data-fx="tier"]', { hasText: "R$ 500" });
  await expect(tierLink).toBeVisible();
  await tierLink.click();

  await page.waitForURL(/\/doar\?valor=500$/);

  const botaoValor = page.getByTestId("valor-500");
  await expect(botaoValor).toHaveAttribute("aria-checked", "true");
  await expect(botaoValor).toHaveAttribute("data-selected", "true");
});
