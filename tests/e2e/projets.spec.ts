import { expect, test } from "@playwright/test";

test("les filtres réduisent la grille et s'inscrivent dans l'URL", async ({ page }) => {
  await page.goto("/projets");
  const cartes = page.getByTestId("project-card");
  const compteur = page.getByTestId("compteur");
  await expect(cartes).toHaveCount(4);

  await page.getByRole("button", { name: "Infrastructure" }).click();
  await expect(page).toHaveURL(/\?categorie=infrastructure$/);
  await expect(cartes).toHaveCount(1);
  await expect(cartes.first()).toContainText("UGB Link");
  await expect(compteur).toHaveText("1 dossier");
  await expect(page.getByRole("button", { name: "Infrastructure" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Tous" }).click();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(cartes).toHaveCount(4);
  await expect(compteur).toHaveText("4 dossiers");
});

test("un lien filtré s'ouvre directement sur le bon filtre", async ({ page }) => {
  await page.goto("/projets?categorie=full-stack");
  await expect(page.getByTestId("project-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Full stack" })).toHaveAttribute("aria-pressed", "true");
});

test("une étude de cas mène au dossier suivant et son sommaire pointe vers ses sections", async ({ page }) => {
  await page.goto("/projets/ugb-link");
  const sommaire = page.getByRole("navigation", { name: "Sommaire" });
  await expect(sommaire.locator('a[href^="#"]')).toHaveCount(7);
  await sommaire.getByRole("link", { name: /Architecture/ }).click();
  await expect(page).toHaveURL(/#architecture$/);
  await expect(page.locator("#architecture")).toBeInViewport();

  await page.getByRole("link", { name: /Dossier suivant/ }).click();
  await expect(page).toHaveURL(/\/projets\/plusutra$/);
});
