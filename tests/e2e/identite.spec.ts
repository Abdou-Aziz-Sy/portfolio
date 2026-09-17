import { expect, test } from "@playwright/test";

test("le nom complet est visible en haut de l'accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Abdou Aziz Sy");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Ingénieur logiciel");
});

test("le logo annonce le nom complet aux lecteurs d'écran", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("banner").getByRole("link", { name: /Abdou Aziz Sy/ });
  await expect(logo).toBeVisible();
});
