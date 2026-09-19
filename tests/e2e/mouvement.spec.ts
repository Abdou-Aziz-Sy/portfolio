import { expect, test, type Page } from "@playwright/test";

export async function animationsInfinies(page: Page) {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getTiming().iterations === Infinity)
      .map((a) => (a as CSSAnimation).animationName ?? "?"),
  );
}

export async function animationsEnCours(page: Page) {
  return page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
}

const PAGES = ["/", "/projets", "/projets/ugb-link", "/a-propos"];

test("aucune animation ne tourne en boucle", async ({ page }) => {
  for (const chemin of PAGES) {
    await page.goto(chemin);
    expect(await animationsInfinies(page), chemin).toEqual([]);
  }
});

test("avec le mouvement réduit, aucune animation ne s'exécute et tout est visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const chemin of PAGES) {
    await page.goto(chemin);
    expect(await animationsEnCours(page), chemin).toBe(0);
    const invisibles = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main *"))
        .filter((el) => getComputedStyle(el).opacity === "0" && el.getClientRects().length > 0)
        .map((el) => el.tagName + "." + el.className),
    );
    expect(invisibles, chemin).toEqual([]);
  }
});

// Chantier 3 : le schéma d'architecture se construit au défilement (blocs, puis flux dans
// l'ordre du trajet d'une requête). N'a de sens que sous Chromium (animation-timeline: view()) ;
// le projet « mobile » tourne aussi sur un moteur Chromium (Edge/Chromium en émulation tactile),
// donc ce test s'y exécute également.
test("le schéma complet se construit au défilement", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets/ugb-link");
  // `getPropertyValue` plutôt que la propriété `.animationTimeline` : cette dernière n'existe pas
  // encore dans les types DOM livrés avec TypeScript 5, alors que la méthode standard, elle,
  // retourne la valeur résolue sans recourir à un cast.
  const timelines = await page.evaluate(() =>
    Array.from(document.querySelectorAll("figure.pa-fig [data-noeud], figure.pa-fig [data-flux] .d-flow"))
      .map((el) => getComputedStyle(el).getPropertyValue("animation-timeline")),
  );
  expect(timelines.length).toBeGreaterThan(10);
  expect(timelines.every((t) => t && t !== "auto")).toBe(true);
  // Une fois le schéma entièrement dans l'écran, tout est dans son état final. Défilement jusqu'au
  // bas de la page plutôt qu'un décalage fixe après `scrollIntoViewIfNeeded` : la hauteur de la
  // fenêtre (donc l'ampleur du défilement nécessaire pour dépasser la plage `cover`) diffère trop
  // entre le projet bureau et le projet mobile (Pixel 7) pour qu'un même nombre de pixels marche
  // sur les deux. Au-delà de sa plage, une animation `both` reste figée à l'état final.
  // `window.scrollTo` plutôt que `mouse.wheel` : ce dernier n'est pas fiable sous l'émulation
  // tactile du projet « mobile », alors que le défilement programmatique l'est.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // Le recalcul de style d'une animation pilotée par le défilement peut prendre une frame de
  // retard sur l'appel à `scrollTo` : deux `requestAnimationFrame` imbriqués, plutôt qu'un délai
  // arbitraire, attendent exactement ce recalcul avant de lire le style calculé.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const opacites = await page.evaluate(() =>
    Array.from(document.querySelectorAll("figure.pa-fig [data-noeud]")).map((el) => getComputedStyle(el).opacity),
  );
  expect(opacites.every((o) => o === "1")).toBe(true);
});

test("la timeline de défilement progresse réellement (l'opacité d'un bloc change entre deux positions)", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets/ugb-link");
  const bloc = page.locator("figure.pa-fig [data-noeud]").first();

  // Position 1 : le haut du schéma tout juste au bas de l'écran (construction à peine amorcée).
  const { top, hauteurEcran } = await page.evaluate(() => {
    const fig = document.querySelector("figure.pa-fig") as HTMLElement;
    return { top: fig.getBoundingClientRect().top + window.scrollY, hauteurEcran: window.innerHeight };
  });
  await page.evaluate(
    ([t, h]) => window.scrollTo(0, t - h + 40),
    [top, hauteurEcran],
  );
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const opacite1 = await bloc.evaluate((el) => getComputedStyle(el).opacity);

  // Position 2 : le schéma entièrement visible (construction terminée). Défilement jusqu'au bas de
  // la page (voir le test précédent) : robuste quelle que soit la hauteur de la fenêtre.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const opacite2 = await bloc.evaluate((el) => getComputedStyle(el).opacity);

  expect(opacite1).not.toBe(opacite2);
  expect(opacite2).toBe("1");
});
