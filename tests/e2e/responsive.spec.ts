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

  test("le texte courant garde sa hauteur de ligne d'avant la refonte (26 px à 16 px de police)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });

    await page.goto("/projets");
    const hauteurCardFoot = await page
      .locator(".pa-card-foot")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));

    await page.goto("/a-propos");
    const hauteurInitiales = await page
      .locator(".pa-initiales")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));

    expect(hauteurCardFoot).toBeCloseTo(26, 0);
    expect(hauteurInitiales).toBeCloseTo(26, 0);
  });

  // Avec auto-fit, les pistes surnuméraires sont conservées dans gridTemplateColumns mais
  // réduites à 0 px : on ne compte que les pistes réellement occupées.
  async function colonnes(page: import("@playwright/test").Page, selecteur: string) {
    return page
      .locator(selecteur)
      .first()
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").filter((piste) => parseFloat(piste) > 0).length,
      );
  }

  test("la grille de projets passe à quatre colonnes sur grand écran", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/projets");
    expect(await colonnes(page, ".pa-grid-projets")).toBe(4);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/projets");
    expect(await colonnes(page, ".pa-grid-projets")).toBe(3);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/projets");
    expect(await colonnes(page, ".pa-grid-projets")).toBe(1);
  });

  test("les domaines passent sur deux colonnes en tablette", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto("/");
    expect(await colonnes(page, ".pa-domains")).toBe(2);
  });

  test("la grille « Autres dossiers » de l'accueil n'a pas de piste vide à 1 920 px", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const grille = page.locator('section[aria-labelledby="titre-projets"] .pa-grid');
    const droiteGrille = await grille.evaluate((el) => el.getBoundingClientRect().right);
    const droiteDerniereCarte = await grille
      .locator(":scope > *")
      .last()
      .evaluate((el) => el.getBoundingClientRect().right);
    expect(Math.abs(droiteGrille - droiteDerniereCarte)).toBeLessThanOrEqual(2);
  });

  test("une carte filtrée sur /projets garde sa largeur de colonne à 1 920 px", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    // « Infrastructure » ne laisse qu'un seul dossier (UGB Link, cf. tests/e2e/projets.spec.ts).
    await page.goto("/projets?categorie=infrastructure");
    const grille = page.locator(".pa-grid-projets");
    await expect(page.getByTestId("project-card")).toHaveCount(1);
    const largeurGrille = await grille.evaluate((el) => el.getBoundingClientRect().width);
    const largeurCarte = await page
      .getByTestId("project-card")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(largeurCarte).toBeLessThanOrEqual(largeurGrille / 4 + 2);
  });
});
