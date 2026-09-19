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
