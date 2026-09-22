import { expect, test } from "@playwright/test";

test("les captures de la plateforme de mentorat se chargent", async ({ page }) => {
  await page.goto("/projets/mentorat-vcn");
  const images = page.locator('[data-testid="capture"] button img');
  await expect(images).toHaveCount(6);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    // 30 s : voir le premier test de medias.spec.ts (optimiseur de Next à froid en CI).
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 30_000 })
      .toBe(true);
  }
});
