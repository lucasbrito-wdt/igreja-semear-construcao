import { expect, test } from "@playwright/test";

// AC-U4 — GIVEN prefers-reduced-motion: reduce WHEN carrega THEN nenhum
// efeito GSAP/Lenis inicializa.
test.describe("AC-U4: prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  test("home carrega sem erro de console, sem [data-fx] com opacity < 1, sem classe lenis no html", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(consoleErrors).toEqual([]);

    // GSAP (gsap.from/.to/.set) escreve opacity diretamente no atributo
    // style do elemento — é esse rastro, e não o opacity computado (que
    // também reflete CSS responsivo alheio a motion, ex. .smGrid em telas
    // estreitas), que evidencia se um efeito chegou a inicializar.
    const opacidadesInline = await page.$$eval("[data-fx]", (elements) =>
      elements
        .map((el) => (el as HTMLElement).style.opacity)
        .filter((valor) => valor !== "")
        .map(Number)
    );
    for (const opacidade of opacidadesInline) {
      expect(opacidade).toBeGreaterThanOrEqual(1);
    }

    const temClasseLenis = await page.evaluate(() =>
      document.documentElement.classList.contains("lenis")
    );
    expect(temClasseLenis).toBe(false);
  });
});
