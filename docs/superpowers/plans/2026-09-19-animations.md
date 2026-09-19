# Chantier 3 — Animations utiles : plan d'implémentation

> **Statut au 19/09/2026 : exécuté et fusionné dans `main`** (tâches 1 à 8 : PR #1 ; tâche 9 et correctifs de la revue finale : branche fix/debordement-a-propos). Les cases ci-dessous n'ont pas été tenues à jour pendant l'exécution ; l'état réel est dans l'historique Git et dans `docs/superpowers/HANDOFF-2026-09-19.md`.

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Goal :** rendre le site vivant sans le rendre bavard. Six animations, chacune avec une fonction (orientation, mise en évidence, continuité, retour d'action), selon le fil « le plan se dessine, puis on peut le lire » ; plus le nettoyage des animations en boucle existantes.

**Architecture :** tout le mouvement vit dans un nouveau fichier `styles/mouvement.css`, importé EN DERNIER dans `app/globals.css` (après `ajouts.css`) : il l'emporte à spécificité égale sur `plan.css`, `mise-en-page.css` et `ajouts.css`. `plan.css` et `tokens.css` restent générés et intouchés. Les animations de défilement sont en CSS natif (`animation-timeline`), sous `@supports`. JavaScript seulement pour le schéma explorable (composant client) et le cercle de thème. Les transitions de page et de filtre utilisent `<ViewTransition>` de React, pris en charge par Next 16.

**Tech Stack :** Next 16.3.5 (App Router), React 19.2.8, TypeScript, CSS `animation-timeline`, View Transitions API, Playwright, Vitest.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-09-17-animations-design.md`.
- Ne jamais modifier `styles/plan.css` ni `styles/tokens.css`.
- Règles inconditionnelles avant les blocs `@media` / `@supports` dans chaque fichier CSS.
- **Mouvement réduit** : sous `prefers-reduced-motion: reduce`, AUCUNE animation ne s'exécute ; l'état final s'affiche immédiatement ; les transitions de vue sont désactivées.
- **Aucune boucle infinie** (`animation-iteration-count: infinite` interdit).
- **Propriétés animées** : `opacity`, `transform`, `clip-path`, `stroke-dashoffset` uniquement. Jamais `width`, `height`, `top`, `left`, `margin`.
- **Durées** : 150–300 ms pour un changement d'état ; 400–700 ms pour une entrée ; progression liée au défilement pour la lecture.
- **Sans JavaScript et sans prise en charge**, tout le contenu est visible dans son état final (pas d'`opacity: 0` persistant).
- **Véracité** : aucun texte d'explication ne doit affirmer autre chose que ce que disent `components/diagrams/UgbLinkDiagram.tsx` et `content/projets/ugb-link.mdx`.
- Code, libellés, commentaires et commits en français. Cycle TDD ; chaque test doit pouvoir échouer.
- Avant `pnpm build` / `pnpm test:e2e` : aucun serveur sur les ports 3000, 3001, 3100. Sous Git Bash : `MSYS_NO_PATHCONV=1` devant les arguments commençant par `/`.
- Lighthouse mobile : accessibilité, bonnes pratiques, SEO à 100 ; CLS à 0.
- Next 16 diffère des versions connues : lire `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` avant toute tâche qui utilise `<ViewTransition>`.

## Clarifications par rapport à la spec

1. **Fichier dédié.** La spec ne dit pas où vit le CSS de mouvement : un fichier `styles/mouvement.css`, importé en dernier, regroupe tout le mouvement et permet de surcharger les animations de `plan.css` sans `!important`.
2. **Apparitions en haut de page.** La spec propose de déclencher `pa-rise`, `pa-tick` et `pa-underline` par `view()`. Or ces éléments sont visibles dès le chargement : une timeline `view()` les afficherait figés à mi-course selon leur position. On les garde donc **temporelles** (une seule fois, au chargement) ; `view()` sert aux éléments situés plus bas (schémas).
3. **Sommaire vivant.** Le sommaire allume déjà la section en cours via `IntersectionObserver` (`components/TableOfContents.tsx`), ce qui fonctionne partout. On le garde, en passant `aria-current` à `"location"` et en ajoutant une transition de l'indicateur ; seule la barre de progression est en CSS `scroll()`.
4. **Schéma explorable.** Un bloc sélectionnable est une bascule : `role="button"` + `aria-pressed`. En mode explorable, le `<svg>` passe de `role="img"` à `role="group"` (un `role="img"` rendrait ses enfants inaccessibles).
5. **Élément partagé carte → étude.** Le titre de la carte (`h3`, `projet.titre`) se transforme en titre principal de l'étude de cas (`h1`, `projet.accroche`) : textes différents, donc fondu enchaîné pendant le déplacement. Le mini-schéma n'a pas d'équivalent dans l'en-tête de l'étude ; il ne reçoit pas de nom partagé.

## Points d'attention issus de la revue finale du chantier 2

1. **Deux définitions de `@keyframes pa-rise`** (`plan.css:295` et `ajouts.css`, la seconde gagne). Ne pas réutiliser `.pa-rise` pour les animations au défilement : créer des noms neufs dans `mouvement.css`.
2. **`transform` déjà animé sur les cartes** (`.pa-card:hover`, `.pa-card--lien:focus-within`, transition de 0,25 s). Toute animation d'entrée d'une carte porte sur l'enveloppe (`.pa-grid-projets > div`) ou utilise la propriété `translate`, jamais `transform` de la carte elle-même.
3. **Grille de `/projets` remplacée à l'hydratation** (repli `ProjectGridStatique` du `<Suspense>` → `ProjectGrid`). Un `<ViewTransition>` animerait ce remplacement comme une entrée : poser les mêmes noms `carte-<slug>` sur les deux rendus et désactiver l'animation d'apparition (`enter`/`exit`) au premier affichage (tâche 6).
4. **Tests de mise en page exposés au mouvement.** Dès la tâche 1, `tests/e2e/responsive.spec.ts` et les autres tests qui mesurent des positions passent `test.use({ reducedMotion: "reduce" })` en tête de fichier ; `tests/e2e/mouvement.spec.ts`, lui, garde le mouvement.
5. **Cercle de thème et en-tête collant** (`z-index: 5`) : vérifier sur capture que l'en-tête n'apparaît pas au-dessus de la capture animée ; au besoin, donner un `view-transition-name` à l'en-tête (tâche 7).

## Fichiers

- Créer : `styles/mouvement.css`, `components/diagrams/SchemaExplorable.tsx`, `components/ProgressionLecture.tsx`, `tests/e2e/mouvement.spec.ts`.
- Modifier : `app/globals.css`, `styles/ajouts.css`, `components/diagrams/UgbLinkDiagram.tsx`, `components/diagrams/MiniDiagram.tsx`, `components/mdx.tsx`, `components/ProjectCard.tsx`, `components/ProjectGrid.tsx`, `app/projets/[slug]/page.tsx`, `components/ThemeToggle.tsx`, `components/TableOfContents.tsx`, `app/blog/[slug]/page.tsx` (si la page d'article existe).

---

### Task 1 : Fichier de mouvement, garde-fous et nettoyage des boucles

**Files:**
- Create: `styles/mouvement.css`, `tests/e2e/mouvement.spec.ts`
- Modify: `app/globals.css`, `styles/ajouts.css`

**Interfaces:**
- Produces: `styles/mouvement.css` (importé en dernier) ; helpers de test `animationsInfinies(page)` et `animationsEnCours(page)` exportés par `tests/e2e/mouvement.spec.ts`.

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/e2e/mouvement.spec.ts` :

```ts
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
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/mouvement.spec.ts
```

Attendu : ÉCHEC du premier test (`pa-packet`, `pa-march`, `pa-pulse`, `pa-blink` en boucle). Le second peut déjà passer : garde-fou.

- [ ] **Step 3: Créer `styles/mouvement.css` et l'importer en dernier**

`app/globals.css` : ajouter `@import "../styles/mouvement.css";` APRÈS `ajouts.css`.

`styles/mouvement.css` :

```css
/* Mouvement (chantier 3). Importé en DERNIER : l'emporte à spécificité égale sur plan.css,
   mise-en-page.css et ajouts.css. Règles : aucune boucle infinie ; seules opacity, transform,
   clip-path et stroke-dashoffset sont animées ; tout est coupé sous prefers-reduced-motion. */

@media (prefers-reduced-motion: no-preference) {
  /* Paquets sur les flux : trois passages puis arrêt ; le paquet s'efface à l'arrivée. */
  .d-packet { animation: pa-paquet 2.8s linear 3 both; }
  .pa-card .d-packet { animation-duration: 2.2s; }
  @keyframes pa-paquet {
    0% { stroke-dashoffset: 100; opacity: 1; }
    90% { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  /* Flux asynchrones : trois avancées de tirets puis arrêt. */
  .d-flow[stroke-dasharray], .d-dash { animation-iteration-count: 3; }
  /* Pastilles et voyants : état statique (la pulsation ne portait aucune information).
     Mêmes sélecteurs que plan.css pour l'emporter par l'ordre, sans !important. */
  .pa-dot:not(.is-open):not(.is-done), .d-ok, .pa-timeline li.is-now .pa-rail::after { animation: none; }
}

@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

En tête de `tests/e2e/responsive.spec.ts` (et de tout fichier de test qui mesure des positions ou des tailles), ajouter `test.use({ reducedMotion: "reduce" });` pour isoler ces tests des animations à venir ; retirer alors les `emulateMedia({ reducedMotion: "reduce" })` locaux devenus redondants.

Dans `styles/ajouts.css`, retirer `animation: none !important;` des règles `.pa-dot.is-dispo` et `.pa-dot.is-accepte` (désormais couvertes par `mouvement.css`), en gardant leurs autres déclarations. Vérifier ensuite par le test que ces pastilles restent immobiles (test existant de `tests/e2e/identite.spec.ts` et de `tests/e2e/a11y.spec.ts`).

- [ ] **Step 4: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/mouvement.spec.ts tests/e2e/identite.spec.ts tests/e2e/a11y.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add styles/mouvement.css app/globals.css styles/ajouts.css tests/e2e/mouvement.spec.ts tests/e2e/responsive.spec.ts
git commit -m "feat(mouvement): fichier dédié, fin des animations en boucle, garde-fous du mouvement réduit"
```

---

### Task 2 : Restructurer le schéma complet en blocs et en flux nommés

Préalable aux animations 1 et 2 : aujourd'hui, `UgbLinkDiagram.tsx` est une suite plate de `rect`, `text`, `path`. Aucun rendu visuel ne doit changer dans cette tâche.

**Files:**
- Modify: `components/diagrams/UgbLinkDiagram.tsx`
- Test: `tests/unit/schema-ugb.test.ts` (créer ; vérifier la convention de `tests/unit/`)

**Interfaces:**
- Produces:
  - chaque bloc enveloppé dans `<g data-noeud="<id>">` (rectangle, textes, pastille, logo), ids : `navigateur`, `nginx`, `front`, `api`, `postgresql`, `redis`, `minio`, `ollama`, `github`, `deploiement`, `sauvegarde`, `stockage` ;
  - chaque flux (tracé, paquet, pointe de flèche, libellé) enveloppé dans `<g data-flux="<de>-<vers>" data-de="<id>" data-vers="<id>" data-ordre="<n>">` ;
  - l'export `FLUX_UGB: ReadonlyArray<{ de: string; vers: string; ordre: number }>` et `NOEUDS_UGB: ReadonlyArray<string>` depuis le même fichier. **Réalisé autrement** (ronde de correction) : `SEGMENTS_UGB` typé `NoeudUgb`, avec un attribut `data-relie` sur chaque segment, troncs partagés compris.
- Flux et ordre du trajet d'une requête (`data-ordre`) :
  1. `navigateur-nginx` (HTTPS)
  2. `nginx-front` (/), `nginx-api` (/api)
  3. `api-postgresql`, `api-redis`, `api-minio`, `api-ollama` (tronc commun `M576 282 L616 282` et vertical `M616 76 L616 284` : inclure le tronc dans CHACUN de ces quatre groupes n'est pas possible sans dupliquer le tracé ; placer le tronc dans un groupe `data-flux="api-bus" data-de="api" data-vers="postgresql redis minio ollama"` et chaque branche horizontale dans son groupe propre)
  4. `api-navigateur` (SSE, pointillé)
  5. `github-deploiement`
  6. `postgresql-sauvegarde`, `minio-sauvegarde` (tirets), `sauvegarde-stockage`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/unit/schema-ugb.test.ts` (rendu serveur avec `react-dom/server`) :

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FLUX_UGB, NOEUDS_UGB, UgbLinkDiagram } from "@/components/diagrams/UgbLinkDiagram";

describe("UgbLinkDiagram", () => {
  const html = renderToStaticMarkup(<UgbLinkDiagram />);

  it("expose chaque bloc comme un nœud nommé", () => {
    for (const id of NOEUDS_UGB) expect(html).toContain(`data-noeud="${id}"`);
    expect(NOEUDS_UGB).toHaveLength(12);
  });

  it("expose chaque flux avec ses extrémités et son ordre", () => {
    for (const f of FLUX_UGB) {
      expect(html).toContain(`data-flux="${f.de}-${f.vers}"`);
      expect(NOEUDS_UGB).toContain(f.de);
    }
  });
});
```

Si `vitest.config.ts` n'accepte pas le JSX dans les tests (`.test.ts`), nommer le fichier `.test.tsx` et le signaler.

- [ ] **Step 2: Lancer et vérifier l'échec** — `pnpm test -- schema-ugb` : ÉCHEC (exports absents).

- [ ] **Step 3: Restructurer** en enveloppant les éléments existants SANS changer une seule coordonnée ni classe. Chaque `rect`, `text`, `circle`, `Logo`, `path`, `polygon` existant doit se retrouver dans exactement un groupe (sauf les zones, étiquettes de zone et la cote « une machine virtuelle », qui restent hors groupes). Ajouter `pathLength={1}` aux `path.d-flow` et `path.d-line` qui n'ont pas de `strokeDasharray` (préparation du tracé au défilement ; sans animation, sans effet visuel).

- [ ] **Step 4: Vérifier l'absence de changement visuel** : `pnpm build`, `bash .work/serve.sh`, `node .work/el.mjs http://localhost:3001/projets/ugb-link "figure.pa-fig" .work/c3t2-apres.png 1440 dark`, comparer à une capture prise AVANT la modification (`git stash`, même commande vers `.work/c3t2-avant.png`, `git stash pop`). Les deux images doivent être identiques à l'œil. Arrêter le serveur.

- [ ] **Step 5: Tests** : `pnpm test`, `pnpm test:e2e tests/e2e/responsive.spec.ts`. **Commit** : `refactor(schéma): blocs et flux nommés dans le schéma d'UGB Link`.

---

### Task 3 : Le schéma se construit au défilement (animation 1)

**Files:**
- Modify: `styles/mouvement.css`, `components/diagrams/MiniDiagram.tsx`
- Test: `tests/e2e/mouvement.spec.ts`

**Interfaces:**
- Consumes: `data-noeud`, `data-flux`, `data-ordre`, `pathLength={1}` (tâche 2).

- [ ] **Step 1: Test qui échoue**

```ts
test("le schéma complet se construit au défilement", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "animation-timeline : Chromium");
  await page.goto("/projets/ugb-link");
  const timelines = await page.evaluate(() =>
    Array.from(document.querySelectorAll("figure.pa-fig [data-noeud], figure.pa-fig [data-flux] .d-flow"))
      .map((el) => getComputedStyle(el).animationTimeline),
  );
  expect(timelines.length).toBeGreaterThan(10);
  expect(timelines.every((t) => t && t !== "auto")).toBe(true);
  // Une fois le schéma entièrement dans l'écran, tout est dans son état final.
  await page.locator("figure.pa-fig").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 400);
  const opacites = await page.evaluate(() =>
    Array.from(document.querySelectorAll("figure.pa-fig [data-noeud]")).map((el) => getComputedStyle(el).opacity),
  );
  expect(opacites.every((o) => o === "1")).toBe(true);
});
```

- [ ] **Step 2: Échec vérifié.**

- [ ] **Step 3: Implémenter** dans `styles/mouvement.css`, sous `@media (prefers-reduced-motion: no-preference)` ET `@supports (animation-timeline: view())` :

```css
  figure.pa-fig svg, .pa-card-fig svg { view-timeline-name: --schema; view-timeline-axis: block; }
  figure.pa-fig [data-noeud], .pa-card-fig .d-box, .pa-card-fig .d-box-acc {
    animation: pa-bloc linear both;
    animation-timeline: --schema;
    animation-range: entry 10% cover 35%;
  }
  figure.pa-fig [data-flux] :is(.d-flow, .d-line):not([stroke-dasharray]) {
    stroke-dasharray: 1; animation: pa-trace linear both;
    animation-timeline: --schema;
  }
  figure.pa-fig [data-flux][data-ordre="1"] :is(.d-flow, .d-line) { animation-range: entry 25% cover 38%; }
  figure.pa-fig [data-flux][data-ordre="2"] :is(.d-flow, .d-line) { animation-range: entry 29% cover 42%; }
  figure.pa-fig [data-flux][data-ordre="3"] :is(.d-flow, .d-line) { animation-range: entry 33% cover 46%; }
  figure.pa-fig [data-flux][data-ordre="4"] :is(.d-flow, .d-line) { animation-range: entry 37% cover 50%; }
  figure.pa-fig [data-flux][data-ordre="5"] :is(.d-flow, .d-line) { animation-range: entry 41% cover 54%; }
  figure.pa-fig [data-flux][data-ordre="6"] :is(.d-flow, .d-line) { animation-range: entry 45% cover 58%; }
  @keyframes pa-bloc { from { opacity: 0.15; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes pa-trace { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
```

L'état de départ des blocs est `opacity: 0.15`, jamais 0. Dans `MiniDiagram.tsx`, ajouter `pathLength={1}` aux `path.d-flow` et `path.d-line`, et appliquer la même règle de tracé aux mini-schémas (une seule plage). Les tirets animés (`[stroke-dasharray]`, `.d-dash`) ne sont pas tracés : ils gardent leur apparence.

- [ ] **Step 4: Succès vérifié**, plus `pnpm test:e2e tests/e2e/mouvement.spec.ts` (aucune boucle, mouvement réduit). **Capture** : deux images de l'étude de cas à 1 440 px, l'une avec le schéma au bas de l'écran (en cours de construction), l'autre entièrement visible (état final). **Commit** : `feat(mouvement): le schéma se construit au défilement`.

---

### Task 4 : Schéma explorable (animation 2)

**Files:**
- Create: `components/diagrams/SchemaExplorable.tsx`
- Modify: `components/mdx.tsx` (`SchemaUgbLink`), `components/diagrams/UgbLinkDiagram.tsx` (prop `explorable?: boolean`), `styles/mouvement.css`, `styles/ajouts.css` si une mise en forme de la liste est nécessaire
- Test: `tests/e2e/schema.spec.ts` (créer)

**Interfaces:**
- Consumes: `NOEUDS_UGB`, `NoeudUgb`, `SEGMENTS_UGB` (`{ id, relie: NoeudUgb[], ordre }`, troncs partagés compris), attributs `data-noeud`, `data-flux` et `data-relie` (liste des blocs reliés par chaque segment) — tâche 2, après sa ronde de correction : `FLUX_UGB` n'existe plus.
- Produces: `<SchemaExplorable />` (client) ; `EXPLICATIONS_UGB: Record<NoeudUgb, { titre: string; texte: string }>`.

Textes d'explication (à reprendre tels quels ; ils ne s'appuient que sur le schéma complet et `content/projets/ugb-link.mdx`) :

| id | titre | texte |
|---|---|---|
| navigateur | Navigateur | Les agents utilisent l'application dans leur navigateur ; les changements leur arrivent en direct, sans recharger la page. |
| nginx | Nginx | Installé sur la machine virtuelle, hors de Docker : il sert le front et relaie `/api` vers Express. La mise en mémoire tampon est désactivée pour les flux en direct. |
| front | Front React | L'interface, compilée en fichiers statiques et servie par Nginx. |
| api | API Express | Les routes, les rôles et l'OCR des documents scannés. Un bus d'événements en mémoire pousse chaque message aux seuls utilisateurs concernés. |
| postgresql | PostgreSQL | Les données des huit processus. |
| redis | Redis | Le cache et les files d'attente. |
| minio | MinIO | Le stockage des documents. |
| ollama | Ollama | Un petit modèle de langage dans son propre conteneur : il lit le document d'un appel à candidature et répond en JSON pour pré-remplir le formulaire. |
| github | GitHub Actions | Construit l'application, la déploie par SSH, puis vérifie que le site public répond. |
| deploiement | Déploiement | La mise à jour des conteneurs sur la machine virtuelle. |
| sauvegarde | Sauvegarde | Une sauvegarde nocturne de la base et des documents. |
| stockage | Stockage distant | Les sauvegardes partent hors site ; un exercice de restauration automatisé les restaure dans un environnement isolé et en contrôle le contenu. |

- [ ] **Step 1: Tests qui échouent** (`tests/e2e/schema.spec.ts`) :
  - la liste `<dl>` d'explications est visible sous le schéma, sur les deux projets, sans interaction, et contient les douze titres ;
  - au clavier (projet bureau) : `Tab` jusqu'au premier bloc (`[data-noeud="navigateur"]`), `Enter` → `aria-pressed="true"`, le `svg` porte `data-actif="navigateur"`, l'entrée correspondante de la liste porte `aria-current="true"` ; `Escape` → plus aucun bloc pressé, plus de `data-actif` ;
  - au survol du bloc `api` (projet bureau) : les groupes de flux dont `data-relie` contient `api` (tronc `api-bus` compris) portent l'état « allumé » (`data-allume`) (vérifier une couleur calculée égale à `--accent`), les autres blocs ont une opacité calculée de 0,35.
  - le `svg` a `role="group"` et chaque bloc un nom accessible égal à son titre.

- [ ] **Step 2: Échec vérifié.**

- [ ] **Step 3: Implémenter.**
  - `UgbLinkDiagram` accepte `explorable?: boolean` : si vrai, `role="group"` sur le `svg` (au lieu de `img`), et sur chaque `g[data-noeud]` : `tabIndex={0}`, `role="button"`, `aria-label={titre}`, `aria-pressed`, `aria-describedby` vers l'entrée de liste.
  - `SchemaExplorable` (client) : état `survol` et `selection` ; `data-actif` sur le `svg` = sélection sinon survol ; `Enter`/`Espace` bascule la sélection ; `Escape` et clic hors du schéma la réinitialisent ; `onMouseEnter` / `onFocus` fixent le survol ; `onMouseLeave` / `onBlur` le retirent. La liste `<dl className="pa-explications">` suit le schéma dans la `figure`, avec `aria-current="true"` sur l'entrée active.
  - CSS (`styles/mouvement.css`, partie inconditionnelle pour les états, transitions de 200 ms dans `no-preference`) : `svg[data-actif] [data-noeud]` → `opacity: 0.35` ; le nœud actif et ses voisins → `opacity: 1` ; flux reliés → `stroke: var(--accent)`. Le calcul des voisins et des flux reliés se fait en JavaScript à partir de `SEGMENTS_UGB` (un segment est relié au bloc actif si sa liste `relie` le contient ; les voisins sont les autres blocs de ces listes), et se traduit par un attribut d'état `data-allume` posé sur les groupes concernés. Ne pas réutiliser le nom `data-relie`, qui est l'attribut structurel de la tâche 2.
  - `SchemaUgbLink` (`components/mdx.tsx`) utilise `<SchemaExplorable />` dans le `DiagramScroller` existant.

- [ ] **Step 4: Succès vérifié**, suite e2e complète (`DiagramScroller` et tests de lisibilité inchangés). **Capture** à 1 440 px avec le bloc `api` sélectionné, et à 375 px (liste visible). **Commit** : `feat(schéma): schéma explorable au survol et au clavier`.

---

### Task 5 : La carte devient l'en-tête de l'étude (animation 3)

**Files:**
- Modify: `components/ProjectCard.tsx`, `app/projets/[slug]/page.tsx`, `styles/mouvement.css`, `next.config.ts` si la documentation l'exige
- Test: `tests/e2e/mouvement.spec.ts`

**Interfaces:**
- Produces: nom de transition partagé `titre-${slug}` sur le `h3` de la carte et sur le `h1` de l'étude de cas.

- [ ] **Step 1: Lire** `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` et `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/` (chercher `viewTransition`) : confirmer l'import (`import { ViewTransition } from "react"`), la configuration éventuelle et le comportement sans prise en charge. Noter la conclusion dans le rapport.

- [ ] **Step 2: Test qui échoue** : sur `/projets` (projet bureau, Chromium), le `h3` de la carte `ugb-link` et le `h1` de `/projets/ugb-link` ont un `view-transition-name` calculé égal (valeur non `none`) ; la navigation par clic sur la carte aboutit bien à l'étude (`toHaveURL`), avec et sans `reducedMotion: "reduce"`.

- [ ] **Step 3: Implémenter** : envelopper le `h3` de `ProjectCard` et le `h1` de l'étude dans `<ViewTransition name={`titre-${slug}`}>`. Durée 300 ms, `ease-out` à l'aller (`::view-transition-group(*)` ciblé par classe de transition si la documentation le permet, sinon règle globale sur `::view-transition-group(titre-*)` impossible en CSS : utiliser `share` / `className` de `<ViewTransition>` selon la documentation lue à l'étape 1).

- [ ] **Step 4: Succès vérifié**, suite complète. **Capture** : une image prise pendant la transition (Playwright, `page.clock` ou capture immédiate après clic) et l'état final. **Commit** : `feat(mouvement): la carte devient l'en-tête de l'étude de cas`.

---

### Task 6 : Filtres qui réorganisent la grille (animation 4)

**Files:**
- Modify: `components/ProjectGrid.tsx`, `styles/mouvement.css`
- Test: `tests/e2e/projets.spec.ts`

- [ ] **Step 1: Test qui échoue** : chaque enveloppe de carte de `ProjectGrid` a un `view-transition-name` calculé unique (`carte-<slug>`) ; après un filtre, le compteur `aria-live` annonce le bon nombre et l'URL porte `?categorie=` (comportement existant inchangé).

- [ ] **Step 2: Implémenter** : envelopper chaque `<div key={c.slug}>` dans `<ViewTransition name={`carte-${c.slug}`}>`, dans `ProjectGrid` ET dans `ProjectGridStatique` (mêmes noms, pour que le remplacement du repli à l'hydratation ne soit pas animé comme une entrée) ; désactiver l'animation d'apparition au premier affichage (props `enter` / `exit` de `<ViewTransition>` selon la documentation lue à la tâche 5). `router.replace` étant une transition dans Next, l'animation de réorganisation s'active seule (le vérifier). Durée 200 ms. Ajouter un test : au chargement de `/projets` (Chromium), aucune animation de transition de vue n'est lancée.

- [ ] **Step 3: Succès vérifié**, suite complète, **commit** : `feat(mouvement): les filtres réorganisent la grille en douceur`.

---

### Task 7 : Changement de thème en cercle (animation 5)

**Files:**
- Modify: `components/ThemeToggle.tsx`, `styles/mouvement.css`
- Test: `tests/e2e/theme.spec.ts`

- [ ] **Step 1: Tests qui échouent** :
  - Chromium, mouvement autorisé : au clic, une animation de `clip-path` sur `::view-transition-new(root)` est lancée (`document.getAnimations()` contient une animation dont `effect.pseudoElement === "::view-transition-new(root)"`), et le thème est appliqué à la fin ;
  - mouvement réduit : bascule instantanée, aucune animation ;
  - le test existant (défaut sombre, bascule, mémorisation) reste vert.

- [ ] **Step 2: Implémenter** dans `basculer()` : si `document.startViewTransition` existe ET que `matchMedia("(prefers-reduced-motion: reduce)")` ne correspond pas, envelopper l'écriture du thème dans `document.startViewTransition(() => flushSync(() => { … }))`, puis, sur `transition.ready`, animer `document.documentElement` avec `clip-path: circle(0 at x y)` → `circle(r at x y)` (`r` = distance au coin le plus éloigné, `x, y` = centre du bouton), 450 ms, `ease-in-out`, `pseudoElement: "::view-transition-new(root)"`. Sinon, bascule directe (comportement actuel). Dans `styles/mouvement.css` : `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }` (le cercle remplace le fondu par défaut).

- [ ] **Step 3: Succès vérifié**, suite complète, **commit** : `feat(mouvement): le nouveau thème s'étend en cercle depuis le bouton`.

---

### Task 8 : Progression de lecture et sommaire vivant (animation 6)

**Files:**
- Create: `components/ProgressionLecture.tsx`
- Modify: `app/projets/[slug]/page.tsx`, page d'article si elle existe, `components/TableOfContents.tsx`, `styles/mouvement.css`
- Test: `tests/e2e/mouvement.spec.ts`

- [ ] **Step 1: Tests qui échouent** :
  - sur `/projets/ugb-link` (Chromium) : un élément `[data-testid="progression"]` existe, `aria-hidden="true"`, avec `animation-timeline` calculé `scroll(root)` ou équivalent ; en bas de page, sa transformation calculée vaut `scaleX(1)` à 0,01 près (`matrix(1, …)`) ; en haut, proche de 0 ;
  - le lien du sommaire de la section visible porte `aria-current="location"` (au lieu de `"true"`).

- [ ] **Step 2: Implémenter.**
  - `ProgressionLecture` : `<div className="pa-progression" data-testid="progression" aria-hidden="true" />`, rendu dans les études de cas et les articles.
  - CSS : `.pa-progression { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); transform-origin: 0 50%; transform: scaleX(0); z-index: 6; }` ; sous `no-preference` + `@supports (animation-timeline: scroll())` : `animation: pa-progression linear both; animation-timeline: scroll(root);` avec `@keyframes pa-progression { to { transform: scaleX(1); } }`. Sans prise en charge ou en mouvement réduit : `display: none` (la barre ne porte aucune information indispensable).
  - `TableOfContents` : `aria-current="location"` ; transition de 200 ms de la couleur et de la bordure du lien actif (propriétés de couleur, autorisées pour un changement d'état).

- [ ] **Step 3: Succès vérifié**, suite complète, **commit** : `feat(mouvement): progression de lecture et sommaire vivant`.

---

### Task 9 : Vérification complète et mesures

- [ ] Chaîne : `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
- [ ] Mouvement réduit : `tests/e2e/mouvement.spec.ts` vert sur les deux projets.
- [ ] Fréquence d'affichage : script Playwright (Chromium) avec `CDPSession` → `Emulation.setCPUThrottlingRate({ rate: 4 })`, défilement de l'accueil puis de `/projets/ugb-link` sur 5 s en comptant les images via `requestAnimationFrame` : rapporter la moyenne (objectif ≥ 50 images/s) ; comparer avec la même mesure sur le commit de départ du chantier (`git stash` ou `git worktree`).
- [ ] Lighthouse mobile : `/`, `/projets`, `/projets/ugb-link` (accessibilité, bonnes pratiques, SEO à 100 ; CLS à 0 ; performance rapportée).
- [ ] Captures aux étapes clés de chaque animation (clair et sombre).
- [ ] Aucun commit vide.

## Self-Review

- **Couverture de la spec** : règles communes 1-7 → tâche 1 (+ chaque tâche) ; animation 1 → tâches 2-3 ; 2 → tâches 2 et 4 ; 3 → tâche 5 ; 4 → tâche 6 ; 5 → tâche 7 ; 6 → tâche 8 ; nettoyage → tâche 1 ; vérification → tâche 9. Écarts assumés : clarifications 2 à 5.
- **Vérifié contre le code réel** : animations de `plan.css` (lignes 275-302) et sélecteurs repris à l'identique pour les surcharger ; `ajouts.css` porte `animation: none !important` sur `.is-dispo` et `.is-accepte` (retirés en tâche 1) ; `UgbLinkDiagram.tsx` est plat (225 lignes, aucun `<g>` par bloc) ; `TableOfContents` utilise déjà `IntersectionObserver` avec `aria-current="true"` ; `ProjectGrid` filtre par `router.replace` ; `ThemeToggle` écrit `data-theme` puis notifie ses abonnés.
- **Points d'incertitude délégués à l'implémentation, avec vérification obligatoire** : API exacte de `<ViewTransition>` dans Next 16 (tâche 5, lecture de la documentation fournie) ; prise en charge de `animation-timeline` dans le navigateur de test (Edge local = Chromium, compatible).
