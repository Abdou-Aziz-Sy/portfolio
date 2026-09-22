import { expect, test } from "@playwright/test";

test("le dossier taskhandler montre le cycle de vie des statuts et la forme des erreurs", async ({ page }) => {
  await page.goto("/projets/taskhandler");
  const schema = page.locator('img[src*="taskhandler-etats"]');
  await expect(schema).toHaveAttribute("alt", /.{80,}/);
  await schema.scrollIntoViewIfNeeded();
  await expect.poll(() => schema.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator("main pre").filter({ hasText: "Transition invalide" })).toHaveCount(1);
});
