import { expect, test, type Page } from "@playwright/test";
import { EXPLICATIONS_UGB, NOEUDS_UGB, SEGMENTS_UGB } from "../../components/diagrams/UgbLinkDiagram";

const URL_ETUDE_DE_CAS = "/projets/ugb-link#architecture";

/** Couleurs de référence (`--accent`/`--ink-faint`), au format `rgb(...)` renvoyé par
 *  `getComputedStyle` — converties depuis les jetons hexadécimaux du thème courant, plutôt que
 *  codées en dur, pour rester justes dans les deux thèmes. */
async function couleursDeReference(page: Page) {
  return page.evaluate(() => {
    const lire = (nom: string) => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
      const n = parseInt(hex.slice(1), 16);
      return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
    };
    return { accent: lire("--accent"), inkFaint: lire("--ink-faint") };
  });
}

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

test.describe("tabindex itinérant", () => {
  test.skip(({ isMobile }) => isMobile, "navigation clavier : projet bureau");

  test("un seul bloc est dans l'ordre de tabulation ; la flèche droite déplace le focus au bloc suivant", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_ETUDE_DE_CAS);

    // Structure : un seul `[data-noeud]` à tabIndex 0 (le premier bloc, sans sélection), les
    // onze autres à -1 — le motif du tabindex itinérant, plutôt que douze arrêts de tabulation.
    const tabIndexAttendu = await page.evaluate(
      (ids) =>
        ids.map((id) => document.querySelector(`[data-noeud="${id}"]`)?.getAttribute("tabindex")),
      NOEUDS_UGB as unknown as string[],
    );
    expect(tabIndexAttendu).toEqual(["0", ...Array(NOEUDS_UGB.length - 1).fill("-1")]);

    // Un Tab suffit à entrer dans le schéma : avec un seul arrêt de tabulation à l'intérieur,
    // le focaliser directement (comme le ferait ce Tab unique) puis vérifier le comportement
    // des flèches et de la sortie, sans dépendre du nombre de liens de navigation qui précèdent
    // la figure dans la page (fragile et sans rapport avec ce que ce test vérifie).
    await page.locator('[data-noeud="navigateur"]').focus();
    await expect(page.locator('[data-noeud="navigateur"]')).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator('[data-noeud="github"]')).toBeFocused();
    await expect(page.locator('[data-noeud="github"]')).toHaveAttribute("tabindex", "0");
    await expect(page.locator('[data-noeud="navigateur"]')).toHaveAttribute("tabindex", "-1");

    // Un second Tab sort du schéma : plus aucun `[data-noeud]` n'a le focus.
    await page.keyboard.press("Tab");
    const focusDansLeSchema = await page.evaluate(
      () => document.activeElement?.closest("[data-noeud]") !== null,
    );
    expect(focusDansLeSchema).toBe(false);
  });
});

test.describe("survol", () => {
  test.skip(({ isMobile }) => isMobile, "le survol n'a pas de sens au toucher");

  test("allume les flux reliés au bloc api (tronc partagé compris) et estompe les autres blocs et flux", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_ETUDE_DE_CAS);
    const { accent, inkFaint } = await couleursDeReference(page);
    await page.locator('[data-noeud="api"]').hover();

    const segmentsApi = SEGMENTS_UGB.filter((s) => s.relie.includes("api"));
    expect(segmentsApi.map((s) => s.id)).toContain("api-bus");

    // Tous les tracés ET toutes les pointes de flèche des segments reliés à `api` passent en
    // accent (stroke pour les tracés, fill pour les pointes) — pas seulement un tracé de
    // référence. `expect.poll` : la transition de 200 ms (styles/mouvement.css) peut encore
    // être en cours juste après `hover()`, la valeur lue doit donc être celle, stabilisée,
    // après la transition, pas une valeur intermédiaire.
    for (const segment of segmentsApi) {
      await expect(page.locator(`[data-flux="${segment.id}"]`)).toHaveAttribute("data-allume", "true");
      const traits = page.locator(`[data-flux="${segment.id}"] :is(.d-flow, .d-line, .d-dash)`);
      for (const trait of await traits.all()) {
        await expect.poll(() => trait.evaluate((el) => getComputedStyle(el).stroke)).toBe(accent);
      }
      const pointes = page.locator(`[data-flux="${segment.id}"] :is(.d-head, .d-head-m)`);
      for (const pointe of await pointes.all()) {
        await expect.poll(() => pointe.evaluate((el) => getComputedStyle(el).fill)).toBe(accent);
      }
    }

    // Un segment non relié à `api` (ex. github-deploiement) reste estompé : ni son tracé
    // (`.d-flow`, bleu accent par défaut, styles/plan.css) ni sa pointe ne doivent afficher la
    // couleur d'accent une fois un bloc actif — ils passent au contraire en `--ink-faint`.
    const segmentNonRelie = "github-deploiement";
    expect(segmentsApi.map((s) => s.id)).not.toContain(segmentNonRelie);
    await expect(page.locator(`[data-flux="${segmentNonRelie}"]`)).not.toHaveAttribute("data-allume", "true");
    const traitNonRelie = page.locator(`[data-flux="${segmentNonRelie}"] .d-flow`).first();
    await expect.poll(() => traitNonRelie.evaluate((el) => getComputedStyle(el).stroke)).toBe(inkFaint);
    const pointeNonReliee = page.locator(`[data-flux="${segmentNonRelie}"] .d-head`).first();
    await expect.poll(() => pointeNonReliee.evaluate((el) => getComputedStyle(el).fill)).toBe(inkFaint);

    const blocsAllumes = new Set(segmentsApi.flatMap((s) => s.relie));
    const autresBlocs = NOEUDS_UGB.filter((id) => !blocsAllumes.has(id));
    expect(autresBlocs.length).toBeGreaterThan(0);
    for (const id of autresBlocs) {
      // Mesurée sur l'enfant (rect/text/…), pas sur le g[data-noeud] : ce dernier porte
      // l'animation de construction au défilement (styles/mouvement.css), à laquelle une
      // déclaration normale sur le même élément ne pourrait pas s'opposer.
      const enfant = page.locator(`[data-noeud="${id}"] > *`).first();
      await expect.poll(() => enfant.evaluate((el) => Number(getComputedStyle(el).opacity)), id).toBeCloseTo(
        0.35,
        2,
      );
    }
  });
});

test.describe("accessibilité", () => {
  test("le svg est un groupe et chaque bloc a un nom accessible égal à son titre", async ({ page }) => {
    await page.goto(URL_ETUDE_DE_CAS);
    await expect(page.locator("figure.pa-fig svg")).toHaveAttribute("role", "group");
    for (const id of NOEUDS_UGB) {
      const bouton = page.getByRole("button", { name: EXPLICATIONS_UGB[id].titre, exact: true });
      await expect(bouton).toHaveCount(1);
    }
  });

  test("le svg est décrit par une consigne clavier visible", async ({ page }) => {
    await page.goto(URL_ETUDE_DE_CAS);
    const svg = page.locator("figure.pa-fig svg");
    const idConsigne = await svg.getAttribute("aria-describedby");
    expect(idConsigne).toBeTruthy();
    const consigne = page.locator(`#${idConsigne}`);
    await expect(consigne).toBeVisible();
    await expect(consigne).toContainText("Entrée");
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
