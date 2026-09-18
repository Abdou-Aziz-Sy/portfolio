import { expect, test } from "@playwright/test";

export const LARGEURS = [320, 375, 768, 1024, 1440, 1920, 2560];

test.describe("mise en page fluide", () => {
  test.skip(({ isMobile }) => isMobile, "largeurs pilotées explicitement : projet bureau seulement");

  test("le contenu occupe jusqu'à 1 920 px sur un écran de 2 560 px", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    const largeurUtile = await page.locator("main .pa-wrap").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    });
    expect(largeurUtile).toBeGreaterThanOrEqual(1900);
    expect(largeurUtile).toBeLessThanOrEqual(1920);
  });

  test("les marges latérales suivent la largeur de l'écran", async ({ page }) => {
    const marges: number[] = [];
    for (const largeur of [375, 1440, 2560]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto("/");
      marges.push(
        await page.locator("main .pa-wrap").first().evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft)),
      );
    }
    expect(marges[0]).toBe(16);
    expect(marges[1]).toBeCloseTo(57.6, 0);
    expect(marges[2]).toBe(96);
  });

  test("les titres grandissent avec l'écran", async ({ page }) => {
    const tailles: Record<number, number> = {};
    for (const largeur of [375, 1440, 2560]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto("/");
      tailles[largeur] = await page.locator("h1.pa-hero").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    }
    expect(tailles[375]).toBeCloseTo(34, 0);
    expect(tailles[2560]).toBeCloseTo(84, 0);
    expect(tailles[1440]).toBeGreaterThan(tailles[375]);
    expect(tailles[1440]).toBeLessThan(tailles[2560]);
  });
});
