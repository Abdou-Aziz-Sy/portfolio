import { expect, test } from "@playwright/test";
import { EXPLICATIONS_UGB, NOEUDS_UGB, SEGMENTS_UGB } from "../../components/diagrams/UgbLinkDiagram";

const URL_ETUDE_DE_CAS = "/projets/ugb-link#architecture";

test.describe("liste d'explications", () => {
  test("est visible sous le schéma, sans interaction, avec les douze titres", async ({ page }) => {
    await page.goto(URL_ETUDE_DE_CAS);
    const liste = page.locator("dl.pa-explications");
    await expect(liste).toBeVisible();
    for (const id of NOEUDS_UGB) {
      await expect(liste.locator("dt", { hasText: EXPLICATIONS_UGB[id].titre })).toHaveCount(1);
    }
    await expect(liste.locator("dt")).toHaveCount(NOEUDS_UGB.length);
  });
});

test.describe("navigation clavier", () => {
  test.skip(({ isMobile }) => isMobile, "navigation clavier : projet bureau");

  test("Entrée bascule la sélection du premier bloc ; Échap réinitialise", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_ETUDE_DE_CAS);
    const svg = page.locator("figure.pa-fig svg");
    const bloc = page.locator('[data-noeud="navigateur"]');

    // Tab jusqu'au premier bloc du schéma (le cadre défilant peut ou non recevoir le focus avant
    // lui, selon qu'il déborde à cette largeur ; on ne préjuge donc pas du nombre de Tab).
    for (let i = 0; i < 20; i++) {
      if (await bloc.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(bloc).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(bloc).toHaveAttribute("aria-pressed", "true");
    await expect(svg).toHaveAttribute("data-actif", "navigateur");
    const entree = page.locator("dl.pa-explications > div", { has: page.locator("dt", { hasText: "Navigateur" }) });
    await expect(entree).toHaveAttribute("aria-current", "true");

    await page.keyboard.press("Escape");
    await expect(bloc).toHaveAttribute("aria-pressed", "false");
    await expect(svg).not.toHaveAttribute("data-actif", /.+/);
    await expect(entree).not.toHaveAttribute("aria-current", "true");
  });
});

test.describe("survol", () => {
  test.skip(({ isMobile }) => isMobile, "le survol n'a pas de sens au toucher");

  test("allume les flux reliés au bloc api (tronc partagé compris) et estompe les autres blocs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_ETUDE_DE_CAS);
    await page.locator('[data-noeud="api"]').hover();

    const segmentsApi = SEGMENTS_UGB.filter((s) => s.relie.includes("api"));
    expect(segmentsApi.map((s) => s.id)).toContain("api-bus");
    for (const segment of segmentsApi) {
      await expect(page.locator(`[data-flux="${segment.id}"]`)).toHaveAttribute("data-allume", "true");
    }

    // Couleur calculée : comparée au trait d'un flux toujours en accent (navigateur → nginx),
    // plutôt qu'à une valeur codée en dur (rgb/hex selon le thème).
    const accent = await page
      .locator('[data-flux="navigateur-nginx"] .d-flow')
      .evaluate((el) => getComputedStyle(el).stroke);
    const troncApiBus = await page.locator('[data-flux="api-bus"] .d-line').first().evaluate((el) => getComputedStyle(el).stroke);
    expect(troncApiBus).toBe(accent);

    const blocsAllumes = new Set(segmentsApi.flatMap((s) => s.relie));
    const autresBlocs = NOEUDS_UGB.filter((id) => !blocsAllumes.has(id));
    expect(autresBlocs.length).toBeGreaterThan(0);
    for (const id of autresBlocs) {
      // Mesurée sur l'enfant (rect/text/…), pas sur le g[data-noeud] : ce dernier porte
      // l'animation de construction au défilement (styles/mouvement.css), à laquelle une
      // déclaration normale sur le même élément ne pourrait pas s'opposer.
      const opacite = await page
        .locator(`[data-noeud="${id}"] > *`)
        .first()
        .evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(opacite, id).toBeCloseTo(0.35, 2);
    }
  });
});

test.describe("accessibilité", () => {
  test("le svg est un groupe et chaque bloc a un nom accessible égal à son titre", async ({ page }) => {
    await page.goto(URL_ETUDE_DE_CAS);
    await expect(page.locator("figure.pa-fig svg")).toHaveAttribute("role", "group");
    for (const id of NOEUDS_UGB) {
      const bouton = page.getByRole("button", { name: EXPLICATIONS_UGB[id].titre });
      await expect(bouton).toHaveCount(1);
    }
  });
});

test.describe("sélection tactile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("la liste d'explications est visible et un toucher sélectionne un bloc", async ({ page }) => {
    await page.goto(URL_ETUDE_DE_CAS);
    await expect(page.locator("dl.pa-explications")).toBeVisible();

    const bloc = page.locator('[data-noeud="api"]');
    await bloc.scrollIntoViewIfNeeded();
    await bloc.tap();
    await expect(bloc).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("figure.pa-fig svg")).toHaveAttribute("data-actif", "api");
  });
});
