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

test("toute la carte ouvre le dossier", async ({ page }) => {
  await page.goto("/projets");
  const carte = page.getByTestId("project-card").first();
  expect(await carte.getByRole("link").count()).toBe(1);
  const boite = await carte.boundingBox();
  await page.mouse.click(boite!.x + boite!.width / 2, boite!.y + 20);
  await expect(page).toHaveURL(/\/projets\/[a-z0-9-]+$/);
});

test("le lien de la carte reste atteignable au clavier avec un contour de focus visible", async ({ page }) => {
  await page.goto("/projets");
  const lien = page.getByTestId("project-card").first().getByRole("link");
  const cible = await lien.elementHandle();
  let estActif = false;
  for (let i = 0; i < 40 && !estActif; i++) {
    await page.keyboard.press("Tab");
    estActif = await page.evaluate((el) => document.activeElement === el, cible);
  }
  expect(estActif).toBe(true);
  await expect(lien).toBeFocused();
  const outline = await lien.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test("le lien « Ouvrir le dossier » tient sur une seule ligne à 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/projets");
  await page.evaluate(() => document.fonts.ready);
  const cartes = page.getByTestId("project-card");
  const nombre = await cartes.count();
  expect(nombre).toBeGreaterThan(0);
  for (let i = 0; i < nombre; i++) {
    const lien = cartes.nth(i).getByRole("link", { name: /Ouvrir le dossier/ });
    // Le lien est un item flex (enfant de .pa-card-foot, display: flex) : son display est donc
    // « blockifié » et getClientRects() ne renvoie qu'un seul rectangle même si son texte
    // s'enroule sur deux lignes. On compare donc la hauteur rendue de sa boîte à sa hauteur de
    // ligne calculée : au-delà d'une ligne et demie, le texte s'est cassé.
    const { hauteurBoite, hauteurLigne } = await lien.evaluate((el) => {
      const cs = getComputedStyle(el);
      let lh = parseFloat(cs.lineHeight);
      if (Number.isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.2;
      return { hauteurBoite: el.getBoundingClientRect().height, hauteurLigne: lh };
    });
    expect(hauteurBoite, `carte ${i}`).toBeLessThan(hauteurLigne * 1.5);
  }
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

// Zod ne sert qu'à valider le contenu au build. Importé par un composant client (via
// lib/schemas.ts), il partait au navigateur : ≈ 86 Kio compressés, entièrement inutilisés.
test("la validation du contenu (Zod) n'est pas envoyée au navigateur", async ({ page, request }) => {
  for (const chemin of ["/", "/projets"]) {
    await page.goto(chemin);
    await page.waitForLoadState("networkidle");
    const scripts = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((n) => n.endsWith(".js")),
    );
    expect(scripts.length).toBeGreaterThan(0);
    for (const url of scripts) {
      const code = await (await request.get(url)).text();
      expect(code.includes("Invalid input to safeExtend"), `${chemin} charge Zod : ${url}`).toBe(false);
    }
  }
});
