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
// L'animation est enregistrée à sa CRÉATION (interception d'`Element.animate`), pas relue dans
// `document.getAnimations()` après coup : l'animation démarre après la résolution asynchrone de
// `transition.ready` et ne dure que 450 ms, si bien qu'une lecture en deux temps (attendre son
// apparition, puis lire ses propriétés) échouait dès que la transition se terminait entre les deux.
test("le clic sur le bouton de thème anime un cercle sur ::view-transition-new(root), puis applique le thème", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.addInitScript(() => {
    const w = window as unknown as { __animations: { pseudo: string; proprietes: string[] }[] };
    w.__animations = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (images, options) {
      const animation = original.call(this, images, options);
      w.__animations.push({
        pseudo: (typeof options === "object" && options?.pseudoElement) || "",
        proprietes: Object.keys((images as Record<string, unknown>) ?? {}),
      });
      return animation;
    };
  });
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __animations: { pseudo: string; proprietes: string[] }[] }).__animations
          .filter((a) => a.pseudo === "::view-transition-new(root)")
          .flatMap((a) => a.proprietes),
      ),
    )
    .toContain("clipPath");

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

  // Chevauchement provoqué DEPUIS la page, au moment où la première transition démarre
  // (`ready`), et non par deux clics espacés d'un délai en millisecondes : le délai dépendait de
  // la vitesse de la machine et laissait souvent la première transition se terminer avant le
  // second clic (3 échecs sur 16 en local). L'état observé est enregistré à la fin de CHAQUE
  // transition, dans un `setTimeout(…, 0)` — donc après le rappel `finished.finally` de
  // ThemeToggle.tsx, qui décide s'il retire la classe.
  await page.evaluate(() => {
    type Fin = { restantes: number; classe: boolean };
    const w = window as unknown as { __transitions: { demarrees: number; terminees: number; fins: Fin[] } };
    w.__transitions = { demarrees: 0, terminees: 0, fins: [] };
    const original = document.startViewTransition.bind(document);
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      const transition = original(arg);
      const rang = ++w.__transitions.demarrees;
      if (rang === 1) {
        // Second clic pendant que la première transition tourne : c'est le cas à protéger.
        transition.ready.then(
          () => document.querySelector<HTMLButtonElement>('[data-testid="theme-toggle"]')?.click(),
          () => {},
        );
      }
      transition.finished.finally(() => {
        w.__transitions.terminees += 1;
        // Nombre de transitions encore en cours mesuré MAINTENANT (une transition plus récente
        // peut se terminer avant le `setTimeout` ci-dessous) ; seule la lecture de la classe est
        // différée, pour passer après le rappel `finished.finally` de ThemeToggle.tsx.
        const restantes = w.__transitions.demarrees - w.__transitions.terminees;
        setTimeout(() => {
          w.__transitions.fins.push({
            restantes,
            classe: document.documentElement.classList.contains("pa-transition-theme"),
          });
        }, 0);
      });
      return transition;
    }) as typeof document.startViewTransition;
    document.querySelector<HTMLButtonElement>('[data-testid="theme-toggle"]')?.click();
  });

  type Etat = { demarrees: number; terminees: number; fins: { restantes: number; classe: boolean }[] };
  const lire = () => page.evaluate(() => (window as unknown as { __transitions: Etat }).__transitions);
  await expect.poll(async () => (await lire()).fins.length).toBe(2);
  const etat = await lire();
  // Le chevauchement a bien eu lieu : à la fin de la première transition (annulée par le
  // navigateur dès que la seconde démarre), une transition tournait encore…
  expect(etat.fins[0].restantes, JSON.stringify(etat)).toBeGreaterThan(0);
  // … et la classe de garde n'a pas été retirée à ce moment-là.
  expect(etat.fins[0].classe).toBe(true);
  // Cohérence finale : deux bascules ramènent au thème initial, et la classe a bien fini par
  // disparaître, retirée par la SECONDE transition, celle qui va à son terme.
  expect(etat.fins[1].classe).toBe(false);
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

// Ronde de correction 2 : la persistance du choix dans `localStorage` doit être SYNCHRONE au
// clic, jamais différée dans le rappel (asynchrone) de `document.startViewTransition` — un clic
// suivi d'un rechargement ou d'une fermeture immédiate de la page ne doit jamais perdre le choix.
// Rechargement IMMÉDIAT après le clic, sans aucune attente intermédiaire (ni `expect`, ni
// `waitForTimeout`) : c'est précisément l'absence d'attente qui expose la fenêtre de perte si le
// rappel n'a pas encore eu l'occasion de s'exécuter au moment de la navigation. Mouvement autorisé
// (pas d'`emulateMedia`) pour que la transition de vue soit réellement empruntée.
test("le choix de thème survit à un rechargement immédiat après le clic (mouvement autorisé)", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.goto("/");
  const racine = page.locator("html");
  await expect(racine).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();
  await page.reload();

  await expect(racine).toHaveAttribute("data-theme", "light");
});
