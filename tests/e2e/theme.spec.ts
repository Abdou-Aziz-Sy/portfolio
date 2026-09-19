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

// Tâche 7 : le nouveau thème s'étend en cercle depuis le bouton cliqué (View Transitions API +
// `clip-path`, animé via `element.animate()` sur le pseudo-élément `::view-transition-new(root)`
// — voir ThemeToggle.tsx). N'a de sens que sous Chromium (API expérimentale) ; Firefox/WebKit
// gardent la bascule instantanée, déjà couverte par le test précédent sur tous les navigateurs.
// `expect.poll` plutôt qu'une lecture immédiate après le clic : l'animation démarre après la
// résolution de `transition.ready` (asynchrone), pas de façon synchrone au clic.
test("le clic sur le bouton de thème anime un cercle sur ::view-transition-new(root), puis applique le thème", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) => a.effect instanceof KeyframeEffect && a.effect.pseudoElement === "::view-transition-new(root)",
            ).length,
      ),
    )
    .toBeGreaterThan(0);

  const proprietesAnimees = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect instanceof KeyframeEffect && a.effect.pseudoElement === "::view-transition-new(root)")
      .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes().flatMap((image) => Object.keys(image))),
  );
  expect(proprietesAnimees).toContain("clipPath");

  await expect(racine).toHaveAttribute("data-theme", "light");
});

// Mouvement réduit : bascule instantanée, sans aucune transition de vue lancée — détecté au clic
// via `matchMedia`, pas seulement par l'absence de l'API. On instrumente
// `document.startViewTransition` (même patron que tests/e2e/mouvement.spec.ts) pour prouver
// qu'il n'est jamais appelé : l'absence d'animation en cours ne le prouverait pas, une animation
// déjà terminée donnerait le même résultat.
test("avec le mouvement réduit, la bascule de thème est instantanée et ne déclenche aucune transition de vue", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.addInitScript(() => {
    const w = window as unknown as { __vtTheme: number };
    w.__vtTheme = 0;
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((callback: () => void | Promise<void>) => {
      w.__vtTheme += 1;
      return original(callback);
    }) as typeof document.startViewTransition;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();
  await expect(racine).toHaveAttribute("data-theme", "light");

  const appels = await page.evaluate(() => (window as unknown as { __vtTheme: number }).__vtTheme);
  expect(appels).toBe(0);
});

// Ronde de correction 1 (Important 1) : un second clic pendant les 450 ms de la transition de
// thème fait annuler (« skip ») la PREMIÈRE transition par le navigateur dès que la seconde
// démarre — son `finished` se résout alors presque aussitôt. Sans contrôle de fraîcheur dans
// ThemeToggle.tsx (`transitionThemeCourante`), le rappel `finished.finally()` de la première
// transition retirerait la classe `pa-transition-theme` alors que la SECONDE tourne encore,
// réintroduisant le fondu par défaut du navigateur en plein cercle (règle CSS de
// styles/mouvement.css, restreinte à cette classe).
test("un second clic pendant la transition de thème ne retire pas prématurément la classe de garde", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  const bouton = page.getByTestId("theme-toggle");
  await bouton.click();
  await page.waitForTimeout(100);
  // `dispatchEvent` plutôt que `.click()` pour le second clic : le clic normal de Playwright
  // attend que l'élément soit visuellement stable, ce que le repaint constant de la transition en
  // cours empêche — constaté en pratique, le second `.click()` se retrouvait ainsi retardé de
  // ~900 ms au lieu des 100 ms voulus, laissant la première transition se terminer naturellement
  // avant le second clic et ne reproduisant donc jamais le chevauchement à tester.
  await bouton.dispatchEvent("click");

  // Attente courte mais non nulle après le second clic : le navigateur annule la première
  // transition dès que la seconde démarre (constaté par instrumentation : son `finished` se résout
  // en quelques dizaines de ms, bien avant les 450 ms de la seconde). Sans cette attente,
  // l'assertion réussirait dès la lecture immédiate simplement parce que le second clic vient
  // lui-même de poser la classe, sans jamais laisser le temps à la fin prématurée de la première
  // transition — bogue potentiel — de la retirer. 200 ms laisse largement le temps à cette
  // résolution précoce de se produire, tout en restant bien avant la fin légitime de la seconde
  // transition (450 ms après le second clic).
  await page.waitForTimeout(200);
  const classeApresDelai = await page.evaluate(() => document.documentElement.classList.contains("pa-transition-theme"));
  expect(classeApresDelai).toBe(true);

  // Cohérence finale : deux bascules ramènent au thème initial, et la classe de garde a bien fini
  // par disparaître (retirée par la SECONDE transition, celle qui va à son terme).
  await expect(racine).toHaveAttribute("data-theme", "dark");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("pa-transition-theme")))
    .toBe(false);
});

// Ronde de correction 1 (Mineur) : preuve directe, plutôt que seulement déduite du comportement de
// `default="none"` (tests/e2e/mouvement.spec.ts, tâches 5 et 6), qu'une bascule de thème sur
// /projets ne fait pas animer les groupes de transition des cartes (`carte-…`) ni des titres
// partagés (`titre-…`) : aucune animation active ne doit porter sur un pseudo-élément
// `::view-transition-group(carte-…)` ou `(titre-…)` pendant la transition de thème.
test("une bascule de thème sur /projets ne fait pas animer les groupes de transition des cartes ou des titres", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.goto("/projets");

  await page.getByTestId("theme-toggle").click();

  // On s'assure d'observer pendant que la transition de thème tourne réellement (présence de
  // l'animation de cercle sur le pseudo-élément racine), pas avant qu'elle ne démarre.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter(
              (a) => a.effect instanceof KeyframeEffect && a.effect.pseudoElement === "::view-transition-new(root)",
            ).length,
      ),
    )
    .toBeGreaterThan(0);

  const pseudosCartesOuTitres = await page.evaluate(() =>
    document
      .getAnimations()
      .map((a) => (a.effect instanceof KeyframeEffect ? a.effect.pseudoElement : null))
      .filter(
        (pseudo): pseudo is string => pseudo !== null && /::view-transition-group\((carte|titre)-/.test(pseudo),
      ),
  );
  expect(pseudosCartesOuTitres).toEqual([]);
});
