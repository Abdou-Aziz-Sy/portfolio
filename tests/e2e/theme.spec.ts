import { expect, test } from "@playwright/test";

test("le thème sombre s'applique par défaut, bascule et reste mémorisé", async ({ page }) => {
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();
  await expect(racine).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-toggle")).toHaveText("Nuit");

  await page.reload();
  await expect(racine).toHaveAttribute("data-theme", "light");

  await page.goto("/projets");
  await expect(racine).toHaveAttribute("data-theme", "light");
});
