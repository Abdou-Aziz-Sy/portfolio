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
  // Uniquement les blocs et les tracés réellement tracés au défilement (pathLength="1", .d-flow
  // ET .d-line — troncs et branches compris) : pas tous les `.d-flow` d'un groupe [data-flux],
  // qui inclurait le flux SSE (api-navigateur). Ce dernier garde sa propre animation en temps réel
  // (pa-march, plan.css) et ne doit jamais recevoir la timeline de défilement — cf. le test dédié
  // ci-dessous, qui protège spécifiquement ce cas.
  const timelines = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'figure.pa-fig [data-noeud], figure.pa-fig [data-flux] :is(.d-flow, .d-line)[pathLength="1"]',
      ),
    ).map((el) => getComputedStyle(el).getPropertyValue("animation-timeline")),
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
  // Assertion faible en elle-même (l'état final « tout à 1 » serait aussi vrai sans aucune
  // animation) : c'est le test suivant, qui compare deux positions de défilement, qui prouve que
  // la timeline progresse réellement. Gardée ici pour vérifier l'état final annoncé par le brief.
  const opacites = await page.evaluate(() =>
    Array.from(document.querySelectorAll("figure.pa-fig [data-noeud]")).map((el) => getComputedStyle(el).opacity),
  );
  expect(opacites.every((o) => o === "1")).toBe(true);
});

// Régression : une règle trop large (`figure.pa-fig [data-flux] :is(.d-flow, .d-line)` sans
// filtre sur pathLength) attraperait aussi le flux SSE, qui porte sa propre animation en temps
// réel (pa-march, `styles/plan.css`, tirets qui avancent, limitée à 3 passages par
// `styles/mouvement.css`). Lui imposer `animation-timeline: --schema` ferait passer `pa-march` du
// temps réel au défilement : hors défilement, l'animation resterait figée et ne rejouerait plus —
// ce qui contredirait la consigne « les tirets animés gardent leur apparence ».
test("le flux SSE (api-navigateur) garde son animation en temps réel, pas la timeline de défilement", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets/ugb-link");
  const sse = await page.evaluate(() => {
    const el = document.querySelector('[data-flux="api-navigateur"] .d-flow');
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      animationTimeline: style.getPropertyValue("animation-timeline"),
      animationName: style.getPropertyValue("animation-name"),
    };
  });
  expect(sse).not.toBeNull();
  expect(sse?.animationName).toBe("pa-march");
  expect(sse?.animationTimeline).toBe("auto");
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

// Tâche 5 : le titre de la carte UGB Link (h3) devient le titre de l'étude (h1) — transition de
// vue nommée `titre-ugb-link`, partagée entre `components/ProjectCard.tsx` et
// `app/projets/[slug]/page.tsx`. Le nom React n'est posé sur l'élément QUE pendant la transition
// (pas au repos) : lire `getComputedStyle(...).viewTransitionName` après coup ne prouve rien. On
// instrumente donc `document.startViewTransition` avant tout script de la page (`addInitScript`,
// survit à la navigation interne au routeur App Router puisqu'il s'agit du même document) : le
// nombre d'appels prouve qu'une transition de vue a bien été déclenchée par le clic, et la lecture
// du nom au moment de l'appel (ancienne carte encore dans le DOM) et au moment où `ready` se résout
// (nouvel en-tête déjà monté, cf. doc React : le nom est posé sur les deux éléments AVANT la mutation
// du DOM par le navigateur, pour permettre la capture de l'instantané « ancien ») prouve l'égalité.
type EtatVT = { appels: number; nomAvant: string | null; nomApres: string | null; pret: boolean };

async function instrumenterViewTransition(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vt: EtatVT };
    w.__vt = { appels: 0, nomAvant: null, nomApres: null, pret: false };
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((callback: () => void | Promise<void>) => {
      w.__vt.appels += 1;
      const carte = document.querySelector('a[href="/projets/ugb-link"]')?.closest("article");
      const h3 = carte?.querySelector("h3");
      w.__vt.nomAvant = h3 ? getComputedStyle(h3).viewTransitionName : null;
      const transition = original(callback);
      transition.ready
        .then(() => {
          const h1 = document.querySelector("h1.pa-hero");
          w.__vt.nomApres = h1 ? getComputedStyle(h1).viewTransitionName : null;
        })
        .catch(() => {})
        .finally(() => {
          w.__vt.pret = true;
        });
      return transition;
    }) as typeof document.startViewTransition;
  });
}

for (const reduit of [false, true]) {
  test(`la carte UGB Link devient l'en-tête de l'étude (transition de vue nommée) — mouvement ${reduit ? "réduit" : "normal"}`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "View Transitions API : Chromium");
    if (reduit) await page.emulateMedia({ reducedMotion: "reduce" });
    const erreursConsole: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") erreursConsole.push(msg.text());
    });
    page.on("pageerror", (err) => erreursConsole.push(String(err)));
    await instrumenterViewTransition(page);
    await page.goto("/projets");
    const carte = page.locator('a[href="/projets/ugb-link"]').first();
    await carte.click();
    await expect(page).toHaveURL(/\/projets\/ugb-link$/);
    // La promesse `ready` (résolue une fois le nouvel en-tête monté ET l'instantané pris) se
    // règle après le changement d'URL — l'attendre explicitement plutôt que de lire l'état tout
    // de suite, sans quoi la lecture de `nomApres` est parfois prise de vitesse (constaté en
    // exécution parallèle : `nomApres` encore `null`).
    await page.waitForFunction(() => (window as unknown as { __vt: EtatVT }).__vt.pret);
    const vt = await page.evaluate(() => (window as unknown as { __vt: EtatVT }).__vt);
    expect(vt.appels).toBeGreaterThan(0);
    expect(vt.nomAvant).toBe("titre-ugb-link");
    expect(vt.nomAvant).not.toBe("none");
    expect(vt.nomApres).toBe(vt.nomAvant);
    expect(erreursConsole).toEqual([]);
  });
}

// Garde-fou de non-régression (PAS une preuve du rôle de `default="none"` — voir le test suivant
// pour celle-ci) : le remplacement du repli statique de la grille (`ProjectGridStatique`) par la
// grille réelle (`ProjectGrid`) à l'hydratation de /projets porte, dans les deux rendus, le même
// nom de transition sur le titre UGB Link (permis : un seul rendu est affiché à la fois). Vérifié
// que ce test passe QUE `default="none"` soit posé ou non sur le `<ViewTransition>` du titre : la
// protection observée ici ne vient donc pas de cette prop. Cause la plus probable (non prouvée
// dans le code, seulement par élimination) : ce remplacement a lieu pendant l'hydratation
// initiale, avant que le titre ne participe à une véritable Transition React côté client — hors
// de ce cadre, React n'appelle pas `document.startViewTransition` du tout (0 appel constaté),
// quelle que soit la configuration du `<ViewTransition>`. Le test reste utile comme garde-fou :
// si ce remplacement se mettait un jour à déclencher une transition de vue (parasite, visible),
// il le détecterait.
test("le remplacement du repli par la grille réelle à l'hydratation de /projets ne déclenche aucune transition de vue", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await instrumenterViewTransition(page);
  await page.goto("/projets");
  await page.waitForLoadState("networkidle");
  const appels = await page.evaluate(
    () => (window as unknown as { __vt: { appels: number } }).__vt.appels,
  );
  expect(appels).toBe(0);
});

// Preuve du rôle réel de `default="none"` : un changement de filtre sur /projets (clic sur l'onglet
// « Backend », qui reste compatible avec UGB Link — categories: [backend, infrastructure, ia] dans
// content/projets/ugb-link.mdx — sa carte n'est donc ni démontée ni remontée, seulement réordonnée/
// conservée) passe par `router.replace` (components/ProjectGrid.tsx), une Transition React côté
// client, SANS RAPPORT avec l'appariement carte→étude. Le titre partagé PERSISTE pendant cette
// transition (ni monté ni démonté) : selon la doc React, un `<ViewTransition>` nommé qui persiste
// ainsi reçoit par défaut un fondu enchaîné à chaque transition de la page, sauf `default="none"`.
//
// Vérifié manuellement (retrait temporaire de `default="none"` sur les deux `<ViewTransition>`,
// rétabli ensuite) :
//   - AVEC `default="none"` (code livré) : `document.startViewTransition` n'est même PAS appelé
//     pour ce changement de filtre (0 appel) — react semble reconnaître qu'aucun `<ViewTransition>`
//     de la page ne participerait, et n'invoque donc pas l'API du navigateur. Protection encore
//     plus forte qu'un simple nom "none".
//   - SANS `default="none"` : `document.startViewTransition` EST appelé, et le nom capturé au
//     moment de l'appel est "titre-ugb-link" (pas "none") — le titre partagé aurait donc animé sur
//     un simple changement de filtre, sans aucun rapport avec la navigation carte→étude.
// D'où l'assertion ci-dessous : quel que soit le nombre d'appels observés, le nom "titre-ugb-link"
// ne doit JAMAIS apparaître dans les noms capturés pendant ce changement de filtre.
test("un changement de filtre sur /projets (transition sans rapport) ne fait pas animer le titre partagé", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.addInitScript(() => {
    const w = window as unknown as { __vtFiltre: { appels: number; noms: string[] } };
    w.__vtFiltre = { appels: 0, noms: [] };
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((callback: () => void | Promise<void>) => {
      w.__vtFiltre.appels += 1;
      const h3 = document.querySelector('a[href="/projets/ugb-link"]')?.closest("article")?.querySelector("h3");
      w.__vtFiltre.noms.push(h3 ? getComputedStyle(h3).viewTransitionName : "(introuvable)");
      return original(callback);
    }) as typeof document.startViewTransition;
  });
  await page.goto("/projets");
  await page.getByRole("button", { name: "Backend" }).click();
  await expect(page).toHaveURL(/categorie=backend/);
  // La carte UGB Link doit toujours être là (categorie backend) : le filtre ne l'a pas démontée.
  await expect(page.locator('a[href="/projets/ugb-link"]')).toBeVisible();
  const etat = await page.evaluate(
    () => (window as unknown as { __vtFiltre: { appels: number; noms: string[] } }).__vtFiltre,
  );
  expect(etat.noms).not.toContain("titre-ugb-link");
});

// Tâche 6 : les filtres réorganisent la grille (cartes conservées qui glissent, retirées qui
// s'effacent, ajoutées qui apparaissent) — `<ViewTransition name={carte-${slug}} ...>` sur
// l'enveloppe de chaque carte (components/ProjectGrid.tsx). Comme pour le titre (tâche 5), le nom
// n'est posé sur l'élément QUE pendant une transition qui le concerne : on réutilise le même
// mécanisme d'interception de `document.startViewTransition` que ci-dessus plutôt que d'en écrire
// un second, en lisant cette fois `viewTransitionName` sur les enveloppes de cartes
// (`.pa-grid-projets > div`, l'élément sur lequel le nom retombe puisque `<ViewTransition>` ne
// pose aucun nœud DOM propre — voir le commentaire de ProjectCard.tsx, tâche 5).
type EtatVTCartes = { appels: number; noms: { href: string | null; nom: string }[][] };

async function instrumenterViewTransitionCartes(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __vtCartes: EtatVTCartes };
    w.__vtCartes = { appels: 0, noms: [] };
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((callback: () => void | Promise<void>) => {
      w.__vtCartes.appels += 1;
      const noms = Array.from(document.querySelectorAll(".pa-grid-projets > div")).map((el) => ({
        href: el.querySelector("a.pa-card-cible")?.getAttribute("href") ?? null,
        nom: getComputedStyle(el).viewTransitionName,
      }));
      w.__vtCartes.noms.push(noms);
      return original(callback);
    }) as typeof document.startViewTransition;
  });
}

// Un changement de filtre passe par `router.replace(..., { transitionTypes: ["filtre-projets"] })`
// (ProjectGrid.tsx) : c'est CE type qui active l'animation des cartes, pas la transition en
// elle-même (le titre partagé, lui, en est exclu par le test précédent). La lecture a lieu AVANT la
// mutation du DOM par le navigateur (comme pour le titre) : elle capture donc l'état « ancien », qui
// contient encore les quatre cartes de « Tous ». Le filtre « Backend » garde gamecupsn et ugb-link
// (dossiers 3 et 1) : ce sont les cartes VISIBLES après le filtre — celles que le brief demande de
// vérifier — donc les seules dont ce test exige le nom réel et unique.
//
// Observation faite pendant l'implémentation, PAS vérifiée par ce test (au-delà de son périmètre) :
// des deux cartes qui SORTENT (hackathon-mcn et plusutra), seule plusutra reçoit un nom réel dans cet
// instantané « ancien » — hackathon-mcn (dossier 4, dernière de la liste avant filtrage) reçoit
// "none" alors que sa configuration `exit` est identique. Reproduit de façon stable sur plusieurs
// filtres (Infrastructure, Backend) : toujours la carte en dernière position dans l'ordre AVANT
// filtrage qui sort de cette façon, jamais une carte en position intermédiaire. Cause non identifiée
// avec certitude (React interne, node_modules/next/dist/compiled/react-dom/cjs/
// react-dom-client.development.js) : les positions non filées sont retirées via le même mécanisme de
// réconciliation (deleteRemainingChildren) que cette dernière, qui reçoit pourtant un nom réel — donc
// pas une simple question de chemin de code emprunté. Sans y voir un défaut à corriger dans ce
// composant (aucune prop ni règle CSS de ce fichier ne distingue les deux cartes), consigné ici et
// dans le rapport de tâche plutôt que passé sous silence.
test("un changement de filtre déclenche une transition de vue ; les cartes qui restent visibles portent un nom unique", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await instrumenterViewTransitionCartes(page);
  await page.goto("/projets");
  await page.getByRole("button", { name: "Backend" }).click();
  await expect(page).toHaveURL(/categorie=backend/);
  await expect(page.getByTestId("project-card")).toHaveCount(2);
  const etat = await page.evaluate(() => (window as unknown as { __vtCartes: EtatVTCartes }).__vtCartes);
  expect(etat.appels).toBeGreaterThan(0);
  const instantane = etat.noms[0];
  const visibles = instantane.filter(
    (c) => c.href === "/projets/ugb-link" || c.href === "/projets/gamecupsn",
  );
  expect(visibles).toHaveLength(2);
  expect(visibles.every((c) => c.nom === `carte-${c.href!.split("/").pop()}`)).toBe(true);
  expect(new Set(visibles.map((c) => c.nom)).size).toBe(2);
});

// Contre-épreuve de la protection décrite au Step 3 de la doc (props `enter`/`exit`/`update` en
// objet, clé `default: "none"`) : une navigation carte → étude (clic sur le lien « Ouvrir le
// dossier », PAS un changement de filtre) ne porte aucun `transitionTypes` — la carte entière ne
// doit donc pas participer à cette transition (nom résolu à "none", donc pas de nœud
// `::view-transition-group` pour elle), seul le titre partagé (test dédié plus haut) doit animer.
test("une navigation carte → étude n'anime pas la carte entière", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await instrumenterViewTransitionCartes(page);
  await page.goto("/projets");
  await page.locator('a[href="/projets/ugb-link"]').first().click();
  await expect(page).toHaveURL(/\/projets\/ugb-link$/);
  const etat = await page.evaluate(() => (window as unknown as { __vtCartes: EtatVTCartes }).__vtCartes);
  expect(etat.appels).toBeGreaterThan(0);
  const instantane = etat.noms[0];
  expect(instantane.length).toBeGreaterThan(0);
  expect(instantane.every((c) => c.nom === "none")).toBe(true);
});

// Tâche 8 : la barre de progression de lecture (ProgressionLecture.tsx) suit le défilement de la
// page via `animation-timeline: scroll(root)`, sans aucun JavaScript. N'a de sens que sous
// Chromium (seul moteur à implémenter `animation-timeline: scroll()` à ce jour) ; le mouvement
// réduit et le défaut de prise en charge sont couverts par des tests dédiés plus bas, qui eux
// s'exécutent sur tous les projets.
function lireEchelleX(matrice: string): number {
  // `matrix(a, b, c, d, e, f)` : `a` porte l'échelle horizontale (transform-origin: 0 50%, aucune
  // rotation ici). "none" (pas de transformation) équivaut à l'identité, donc a = 1.
  if (matrice === "none") return 1;
  const nombres = matrice.match(/matrix\(([^)]+)\)/)?.[1].split(",").map((n) => parseFloat(n.trim()));
  if (!nombres) throw new Error(`transform inattendu : ${matrice}`);
  return nombres[0];
}

test("la barre de progression suit le défilement (animation-timeline: scroll(root))", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "animation-timeline: scroll() : Chromium");
  await page.goto("/projets/ugb-link");
  const barre = page.getByTestId("progression");
  await expect(barre).toHaveAttribute("aria-hidden", "true");

  // Le navigateur écrit la valeur résolue soit `scroll(root)`, soit `scroll(root block)` (les deux
  // formes sont observées selon les moteurs) : on accepte les deux plutôt que de figer un format.
  const timeline = await barre.evaluate((el) => getComputedStyle(el).getPropertyValue("animation-timeline"));
  expect(["scroll(root)", "scroll(root block)"]).toContain(timeline.trim());

  // En haut de page, la barre est quasiment invisible (échelle proche de 0).
  const echelleHaut = await barre.evaluate((el) => getComputedStyle(el).transform);
  expect(lireEchelleX(echelleHaut)).toBeLessThan(0.01);

  // En bas de page, la barre est pleine (échelle proche de 1) — `expect.poll` plutôt qu'une seule
  // lecture : le recalcul de style d'une animation pilotée par le défilement peut prendre une
  // frame de retard sur `scrollTo`.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(async () => {
      const t = await barre.evaluate((el) => getComputedStyle(el).transform);
      return lireEchelleX(t);
    })
    .toBeGreaterThan(0.99);
});

test("sous mouvement réduit, la barre de progression est masquée", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projets/ugb-link");
  const barre = page.getByTestId("progression");
  await expect(barre).toHaveCSS("display", "none");
});

test("le sommaire annonce la section visible via aria-current=\"location\"", async ({ page }) => {
  await page.goto("/projets/ugb-link");
  const sommaire = page.getByRole("navigation", { name: "Sommaire" });
  // Au chargement, aucune section n'est encore dans la zone observée par l'IntersectionObserver
  // (TableOfContents.tsx) : on défile jusqu'à une section pour en amener une dans le champ, comme
  // le fait déjà le test voisin (« mène au dossier suivant »).
  await sommaire.getByRole("link", { name: /Architecture/ }).click();
  const lienActif = sommaire.locator('a[aria-current]');
  await expect(lienActif).toHaveAttribute("aria-current", "location");
  await expect(lienActif).toHaveText(/Architecture/);
});

// Tâche 9, test reporté de la tâche 6 : la règle commune « tout est coupé sous
// prefers-reduced-motion » (styles/mouvement.css, règle générale en fin de fichier — pas une règle
// propre aux cartes) neutralise `::view-transition-group(*)`, `::view-transition-old(*)` et
// `::view-transition-new(*)` par `animation: none !important`, quel que soit le nom porté. Ce test
// ne porte donc pas sur l'appel de `document.startViewTransition` (react peut toujours l'invoquer :
// voir les tests plus haut sur `__vtCartes.appels`) mais sur le résultat concret : aucune animation
// dont l'effet cible un pseudo-élément `::view-transition-*` ne doit apparaître dans
// `document.getAnimations()` juste après le clic sur un filtre.
//
// `await expect(page).toHaveURL(...)` avant la lecture, PAS un simple enchaînement clic→lecture :
// vérifié par expérimentation (commentant temporairement la règle CSS ci-dessus, jamais committé)
// qu'une lecture immédiatement après `click()` renvoie systématiquement un tableau vide qu'importe
// que la règle soit présente ou non — `router.replace` déclenche `document.startViewTransition` de
// façon asynchrone (après le retour de `click()`), donc lire trop tôt ne prouve rien : ce n'est pas
// une lecture « avant que l'animation ait eu lieu », mais une lecture « avant que la transition
// n'ait même commencé ». Attendre le changement d'URL est la première preuve observable que
// `router.replace` — donc la transition — a bien été traité : à ce moment, avec la règle retirée,
// `document.getAnimations()` contient bien des `::view-transition-group/-old(carte-…)`,
// `::view-transition-old(root)` etc. (constaté à plusieurs reprises) ; avec la règle en place
// (code livré), le tableau est vide. Le test échoue donc bien sans la règle, et passe avec.
test("sous mouvement réduit, un changement de filtre ne lance aucune animation de transition de vue sur les cartes", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "View Transitions API : Chromium");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projets");
  await page.getByRole("button", { name: "Backend" }).click();
  await expect(page).toHaveURL(/categorie=backend/);
  const animationsVT = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect instanceof KeyframeEffect && a.effect.pseudoElement?.startsWith("::view-transition"))
      .map((a) => ({ pseudo: (a.effect as KeyframeEffect).pseudoElement, playState: a.playState })),
  );
  expect(animationsVT).toEqual([]);
});

// Tâche 9, test reporté de la tâche 8 : la barre de progression de lecture (ProgressionLecture.tsx)
// n'est montée que sur les pages d'étude de cas (app/projets/[slug]/page.tsx, app/blog/[slug]/page.tsx)
// — jamais sur l'accueil, la liste des projets ou la page « à propos », qui n'ont pas de longue
// lecture linéaire à mesurer.
test("la barre de progression est absente en dehors des pages de lecture longue", async ({ page }) => {
  for (const chemin of ["/", "/projets", "/a-propos"]) {
    await page.goto(chemin);
    await expect(page.getByTestId("progression")).toHaveCount(0);
  }
});

// Régression : la timeline était posée sur `figure.pa-fig`, qui contient aussi la liste des
// explications (≈ 2 000 px). Ses plages `cover` ne s'achevaient qu'une fois le schéma sorti de
// l'écran : un lecteur voyait des flux à moitié tracés alors que tout le schéma était visible.
// Spec : le schéma est terminé avant d'atteindre le milieu de l'écran.
async function etatDuSchema(page: Page, cadre: string, blocs: string, traces: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    const bas = el.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo(0, bas - window.innerHeight + 2);
  }, cadre);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.evaluate(
    ([b, t]) => ({
      blocs: Array.from(document.querySelectorAll(b)).map((el) => getComputedStyle(el).opacity),
      traces: Array.from(document.querySelectorAll(t)).map((el) => parseFloat(getComputedStyle(el).strokeDashoffset)),
    }),
    [blocs, traces],
  );
}

test("le schéma complet est entièrement tracé dès qu'il est entièrement visible", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets/ugb-link");
  const etat = await etatDuSchema(
    page,
    "figure.pa-fig .pa-schema-cadre",
    "figure.pa-fig [data-noeud]",
    'figure.pa-fig [data-flux] :is(.d-flow, .d-line)[pathLength="1"]',
  );
  expect(etat.traces.length).toBeGreaterThan(10);
  expect(etat.blocs.every((o) => o === "1"), `opacités ${etat.blocs}`).toBe(true);
  expect(etat.traces.every((d) => d === 0), `décalages ${etat.traces}`).toBe(true);
});

test("le mini-schéma d'une carte est entièrement tracé dès qu'il est entièrement visible", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets");
  const etat = await etatDuSchema(
    page,
    ".pa-grid-projets > div:first-child .pa-card-fig",
    ".pa-grid-projets > div:first-child .pa-card-fig :is(.d-box, .d-box-acc)",
    '.pa-grid-projets > div:first-child .pa-card-fig .d-flow[pathLength="1"]',
  );
  expect(etat.traces.length).toBeGreaterThan(0);
  expect(etat.blocs.every((o) => o === "1"), `opacités ${etat.blocs}`).toBe(true);
  expect(etat.traces.every((d) => d === 0), `décalages ${etat.traces}`).toBe(true);
});

// Régression : l'IntersectionObserver ne signalait que les titres qui traversaient une bande de
// l'écran ; après un saut (lien, retour arrière, défilement rapide), aucun titre ne la traversait
// et le sommaire restait sur une section déjà quittée.
test("le sommaire suit la section en cours après un saut de défilement", async ({ page }) => {
  await page.goto("/projets/ugb-link");
  await page.evaluate(() => {
    const cible = document.querySelector("figure.pa-fig") as HTMLElement;
    window.scrollTo(0, cible.getBoundingClientRect().top + window.scrollY - 100);
  });
  const lienActif = page.getByRole("navigation", { name: "Sommaire" }).locator("a[aria-current]");
  await expect(lienActif).toHaveText(/Architecture/);
});
