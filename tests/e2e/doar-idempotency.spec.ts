import { expect, test } from "@playwright/test";

import { mockDoacoesPost, preencherDadosBasicos } from "./support/donation";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test("Idempotency-Key é enviado no POST e se repete no retry após 502", async ({ page }) => {
  const idempotencyKeys: Array<string | undefined> = [];

  await mockDoacoesPost(page, async (route) => {
    idempotencyKeys.push(route.request().headers()["idempotency-key"]);
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ message: "erro-provedor" }),
    });
  });

  await page.goto("/doar");
  await page.getByTestId("valor-100").click();
  await preencherDadosBasicos(page);
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-erro")).toBeVisible();
  expect(idempotencyKeys).toHaveLength(1);
  expect(idempotencyKeys[0]).toMatch(UUID_REGEX);

  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await page.getByTestId("btn-confirmar").click();

  await expect(page.getByTestId("tela-erro")).toBeVisible();
  expect(idempotencyKeys).toHaveLength(2);
  expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
});
