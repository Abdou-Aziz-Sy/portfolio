import { expect, test } from "@playwright/test";

test("le bandeau de contact donne l'e-mail, GitHub et un bouton Copier", async ({ page, context, browserName }, testInfo) => {
  await page.goto("/#contact");
  const bandeau = page.locator("#contact");
  await expect(bandeau).toContainText("abdouazizsy@esp.sn");
  await expect(bandeau.getByRole("link", { name: /GitHub/ })).toBeVisible();

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await bandeau.getByRole("button", { name: /Copier/ }).click();

  if (testInfo.project.name === "chromium") {
    // Permissions presse-papiers accordées : la copie doit réussir, pas juste
    // « ne pas planter ». Un test qui accepte aussi l'échec ne prouve rien.
    await expect(bandeau.getByRole("button")).toContainText("Copié");
    await expect(bandeau.getByRole("status")).toContainText("Adresse copiée");
  } else {
    await expect(bandeau.getByRole("button")).toContainText(/Copié|Copie impossible/);
  }
});

test("un second clic rapproché prolonge le message de confirmation", async ({ page, context, browserName }) => {
  // Horloge simulée plutôt que waitForTimeout(...) réels : avance le temps du
  // navigateur (et donc les setTimeout du composant) sans attendre pour de vrai.
  await page.clock.install();
  await page.goto("/#contact");
  const bandeau = page.locator("#contact");

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }

  // Locator stable indépendant du libellé : « Copier » filtré par nom ne
  // correspondrait plus une fois le bouton passé en état de confirmation.
  const bouton = bandeau.getByRole("button");
  await bouton.click();
  await page.clock.runFor(1200);
  await bouton.click();
  // 2,2 s après le premier clic (donc après ses 2 s), mais 1 s après le second
  // clic (donc avant la fin de ses 2 s) : le message doit encore être affiché.
  await page.clock.runFor(1000);
  await expect(bouton).toContainText(/Copié|Copie impossible/);
});

test("le CV se télécharge sous un nom explicite", async ({ page }) => {
  const chemins = ["/", "/projets/ugb-link"];
  for (const chemin of chemins) {
    await page.goto(chemin);
    const liens = page.locator('a[href="/cv.pdf"]');
    const n = await liens.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(liens.nth(i)).toHaveAttribute("download", "CV_Abdou_Aziz_SY.pdf");
    }
  }
});

test("l'adresse est lisible sans interaction, au même niveau que le bouton", async ({ page }) => {
  await page.goto("/");
  const adresse = page.locator(".pa-cta-adresse a[href^='mailto:']");
  await expect(adresse).toBeVisible();
  // Un lien mailto peut ne rien ouvrir (aucun client de messagerie configuré) : l'adresse doit
  // donc se lire à l'œil, à la taille du texte courant, pas en mention secondaire.
  const taille = await adresse.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(taille).toBeGreaterThanOrEqual(16);
  await expect(page.locator(".pa-cta-adresse button")).toHaveText("Copier");
});
