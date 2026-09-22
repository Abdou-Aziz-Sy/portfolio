import { expect, test } from "@playwright/test";

test("le dossier Gestion de stages montre le dépôt d'une candidature", async ({ page }) => {
  await page.goto("/projets/gestion-stage");
  const schema = page.locator('img[src*="gestion-stage-candidature"]');
  await expect(schema).toHaveAttribute("alt", /.{80,}/);
  await schema.scrollIntoViewIfNeeded();
  await expect.poll(() => schema.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});
