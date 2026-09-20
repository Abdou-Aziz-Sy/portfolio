# Chantier 4a — Structure et interface : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Goal :** préparer le portfolio à recevoir cinq études de cas — retirer PlusUtra, installer les deux portraits, rendre le contact utilisable sans client de messagerie, et remplir la première vue sur grand écran.

**Architecture :** aucun nouveau composant. `content/site.ts` porte désormais deux portraits au lieu d'un ; `components/Frame.tsx` choisit l'image selon sa variante ; `components/CtaBand.tsx` remonte l'adresse e-mail au niveau des boutons ; les espacements de grand écran vivent dans `styles/mise-en-page.css`, jamais dans `plan.css` (généré).

**Tech Stack :** Next.js 16 (App Router, rendu statique), TypeScript, `next/image`, Playwright, Vitest.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-09-20-contenu-projets-design.md`.
- Ne jamais modifier `styles/plan.css` ni `styles/tokens.css` (générés).
- Code, libellés, commentaires et commits en français. Cycle TDD : chaque test doit pouvoir échouer.
- Avant `pnpm build` ou `pnpm test:e2e` : aucun serveur sur les ports 3000, 3001, 3100 (Playwright réutilise un serveur existant et testerait un ancien build).
- Les e2e tournent avec Edge en local, Chromium sous Linux en CI : ne jamais conclure « vert » sans la CI. Sous Git Bash, préfixer par `MSYS_NO_PATHCONV=1` les commandes qui reçoivent un chemin commençant par `/`.
- Aucun contenu inventé : le site n'affirme que ce que les dépôts prouvent.
- Lighthouse en production après fusion : accessibilité, bonnes pratiques et SEO à 100, performance ≥ 95, CLS à 0.

## Fichiers

- Supprimer : `content/projets/plusutra.mdx`.
- Créer : `public/portrait-accueil.jpg`, `public/portrait-apropos.jpg`.
- Modifier : `content/projets/gamecupsn.mdx`, `content/projets/hackathon-mcn.mdx`, `content/site.ts`, `components/Frame.tsx`, `components/CtaBand.tsx`, `styles/ajouts.css`, `styles/mise-en-page.css`, `README.md`, `tests/e2e/projets.spec.ts`, `tests/e2e/liens.spec.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/mouvement.spec.ts`, `tests/e2e/responsive.spec.ts`, `tests/e2e/identite.spec.ts`.

---

### Task 1 : Retirer PlusUtra et renuméroter les dossiers

**Files:**
- Delete: `content/projets/plusutra.mdx`
- Modify: `content/projets/gamecupsn.mdx:5`, `content/projets/hackathon-mcn.mdx:5`, `README.md:45`
- Test: `tests/e2e/projets.spec.ts`, `tests/e2e/liens.spec.ts`, `tests/e2e/navigation.spec.ts`, `tests/e2e/mouvement.spec.ts`

**Interfaces:**
- Produces : trois dossiers publiés, numérotés 01 (ugb-link), 02 (gamecupsn), 03 (hackathon-mcn). Les tâches suivantes et le chantier 4b s'appuient sur cette numérotation.

- [ ] **Step 1: Mettre à jour les tests qui comptent les dossiers**

Dans `tests/e2e/projets.spec.ts`, premier test :

```ts
  await expect(cartes).toHaveCount(3);
```

puis, plus bas dans le même test :

```ts
  await page.getByRole("button", { name: "Tous" }).click();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(cartes).toHaveCount(3);
  await expect(compteur).toHaveText("3 dossiers");
```

Deuxième test (`un lien filtré s'ouvre directement sur le bon filtre`) : après le retrait de PlusUtra, « Full stack » ne garde que gamecupsn et hackathon-mcn :

```ts
  await expect(page.getByTestId("project-card")).toHaveCount(2);
```

Test `le sommaire d'une étude de cas mène au dossier suivant` : le dossier qui suit ugb-link est désormais gamecupsn :

```ts
  await expect(page).toHaveURL(/\/projets\/gamecupsn$/);
```

Dans `tests/e2e/liens.spec.ts`, retirer la ligne `"/projets/plusutra",` du tableau `PAGES_TEST`.

Dans `tests/e2e/navigation.spec.ts` ligne 3, remplacer le tableau :

```ts
const PAGES = ["/", "/projets", "/projets/ugb-link", "/projets/gamecupsn", "/a-propos"];
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/projets.spec.ts --project=chromium --reporter=line
```

Attendu : ÉCHEC — la grille contient encore 4 cartes et le compteur affiche « 4 dossiers ».

- [ ] **Step 3: Supprimer le dossier et renuméroter**

```bash
git rm content/projets/plusutra.mdx
```

`content/projets/gamecupsn.mdx` ligne 5 : `dossier: 2`.
`content/projets/hackathon-mcn.mdx` ligne 5 : `dossier: 3`.

`README.md` ligne 45 : remplacer `(voir `plusutra.mdx`)` par `(voir `gamecupsn.mdx`)`.

- [ ] **Step 4: Corriger le commentaire de mouvement.spec.ts**

Le long commentaire qui précède le test `un changement de filtre déclenche une transition de vue…` (vers la ligne 310) décrit l'état « ancien » comme contenant « les quatre cartes de "Tous" » et cite `plusutra` comme carte sortante. Remplacer ces deux mentions :

- « qui contient encore les quatre cartes de « Tous » » → « qui contient encore les trois cartes de « Tous » » ;
- le paragraphe « Observation faite pendant l'implémentation… » nomme `plusutra` et `hackathon-mcn` : remplacer `plusutra` par `hackathon-mcn` et `hackathon-mcn (dossier 4, dernière de la liste avant filtrage)` par `hackathon-mcn (dossier 3, dernière de la liste avant filtrage)`, en gardant le constat tel quel — c'est la carte en dernière position qui reçoit « none ».

Le test lui-même est inchangé : le filtre « Backend » garde bien ugb-link et gamecupsn, soit deux cartes.

- [ ] **Step 5: Relancer la chaîne**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm exec playwright test --reporter=line
```

Attendu : tout vert. Si `tests/e2e/identite.spec.ts` ou `tests/e2e/responsive.spec.ts` échouent sur un compte de cartes, corriger le compte (jamais le comportement).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(contenu): retire PlusUtra et renumérote les dossiers

Projet écrit sous assistance, non défendable en entretien. Les dossiers
restants sont renumérotés 01 à 03 ; les tests suivent."
```

---

### Task 2 : Deux portraits selon la taille d'affichage

**Files:**
- Create: `public/portrait-accueil.jpg`, `public/portrait-apropos.jpg`
- Modify: `content/site.ts`, `components/Frame.tsx`
- Test: `tests/e2e/identite.spec.ts`

**Interfaces:**
- Consumes : rien.
- Produces : `site.portraits: { accueil?: string; apropos?: string }` dans `content/site.ts` ; `Frame` continue d'accepter `{ feuille: string; variante: "accueil" | "apropos" }`.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à la fin de `tests/e2e/identite.spec.ts` :

```ts
test("le cartouche affiche le portrait, pas les initiales", async ({ page }) => {
  for (const [chemin, largeurAttendue] of [
    ["/", 720],
    ["/a-propos", 720],
  ] as const) {
    await page.goto(chemin);
    const portrait = page.locator("figure.pa-frame img");
    await expect(portrait, chemin).toHaveCount(1);
    await expect(portrait, chemin).toHaveAttribute("alt", /Abdou Aziz Sy/);
    // Dimensions intrinsèques déclarées : sans elles, l'image réserve mal sa place et décale la
    // mise en page pendant le chargement (CLS).
    expect(await portrait.evaluate((el) => (el as HTMLImageElement).naturalWidth), chemin).toBe(
      largeurAttendue,
    );
    await expect(page.locator("figure.pa-frame .pa-initiales"), chemin).toHaveCount(0);
  }
});

test("chaque page utilise son propre portrait", async ({ page }) => {
  await page.goto("/");
  const accueil = await page.locator("figure.pa-frame img").getAttribute("src");
  await page.goto("/a-propos");
  const apropos = await page.locator("figure.pa-frame img").getAttribute("src");
  expect(accueil).toBeTruthy();
  expect(apropos).toBeTruthy();
  expect(accueil).not.toBe(apropos);
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/identite.spec.ts -g "cartouche" --project=chromium --reporter=line
```

Attendu : ÉCHEC — aucune `img` dans le cartouche, seules les initiales « AAS » sont rendues.

- [ ] **Step 3: Produire les deux images**

Les sources sont les deux photos fournies par l'auteur, déjà recadrées au format du cartouche (720 × 840, ratio 6/7) dans `.work/` :

```bash
cp .work/portrait-b-serre.jpg public/portrait-accueil.jpg
cp .work/p5-b-geste.jpg public/portrait-apropos.jpg
```

Vérifier les dimensions et le poids :

```bash
node -e "const s=require('./node_modules/.pnpm/sharp@0.35.4_@types+node@20.19.43/node_modules/sharp');for(const f of ['public/portrait-accueil.jpg','public/portrait-apropos.jpg'])s(f).metadata().then(m=>console.log(f,m.width+'x'+m.height));"
```

Attendu : `720x840` pour les deux. Si un fichier dépasse 150 Kio, le réencoder en qualité 82.

- [ ] **Step 4: Déclarer les deux portraits dans le contenu**

`content/site.ts` : remplacer la ligne du portrait unique

```ts
  /** Chemin du portrait dans public/, à renseigner quand le fichier est fourni. */
  portrait: undefined as string | undefined,
```

par

```ts
  /** Un portrait par emplacement : le cartouche de l'accueil ne fait que 160 à 360 px de large,
   *  celui d'« à propos » est bien plus grand et supporte une photo avec du décor. */
  portraits: {
    accueil: "/portrait-accueil.jpg" as string | undefined,
    apropos: "/portrait-apropos.jpg" as string | undefined,
  },
```

- [ ] **Step 5: Choisir l'image dans le cartouche**

`components/Frame.tsx` : remplacer le corps du composant par

```tsx
export function Frame({ feuille, variante }: { feuille: string; variante: "accueil" | "apropos" }) {
  const portrait = site.portraits[variante];
  return (
    <figure className={`pa-frame pa-frame--${variante}`}>
      {portrait ? (
        <Image
          className="pa-frame-media"
          src={portrait}
          alt={`Portrait de ${site.nom}`}
          width={720}
          height={840}
          priority
          sizes={variante === "accueil" ? "(max-width: 767px) 160px, 360px" : "(max-width: 767px) 100vw, 420px"}
        />
      ) : (
        <div className="pa-ph pa-frame-media" role="img" aria-label={`Initiales d'${site.nom}`}>
          <span className="pa-initiales" aria-hidden="true">
            {site.initiales}
          </span>
        </div>
      )}
      <figcaption className="pa-frame-block pa-meta">
        <span>
          {site.signature} — {site.villeCourte}
        </span>
        <span>FEUILLE {feuille}</span>
      </figcaption>
    </figure>
  );
}
```

Le repli sur les initiales est conservé : il sert encore si un fichier manque.

- [ ] **Step 6: Vérifier**

```bash
pnpm lint && pnpm typecheck
pnpm exec playwright test tests/e2e/identite.spec.ts --reporter=line
```

Attendu : les deux nouveaux tests passent, les anciens aussi.

- [ ] **Step 7: Revue visuelle**

```bash
bash .work/serve.sh
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/ ".pa-frame" .work/c4-cartouche-accueil.png 1440 dark
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/a-propos ".pa-frame" .work/c4-cartouche-apropos.png 1440 dark
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/ ".pa-frame" .work/c4-cartouche-mobile.png 375 dark
```

Regarder les trois captures : le visage doit rester net et centré, la légende « A. A. SY — DAKAR, SN » lisible, aucun débordement du cadre.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(identité): portrait dans le cartouche, une photo par emplacement

Le cartouche de l'accueil (160 à 360 px) reçoit un portrait serré sur fond
neutre ; celui d'« à propos », plus grand, la photo prise à l'ESP. Le repli
sur les initiales est conservé si un fichier manque."
```

---

### Task 3 : Un contact qui ne tombe jamais dans le vide

**Files:**
- Modify: `components/CtaBand.tsx`, `styles/ajouts.css`
- Test: `tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes : `CopyEmail` (`components/CopyEmail.tsx`), inchangé.
- Produces : un bloc `.pa-cta-adresse` dans le bandeau de contact, contenant l'adresse et le bouton « Copier ».

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/contact.spec.ts` :

```ts
test("l'adresse est lisible sans interaction, au même niveau que le bouton", async ({ page }) => {
  await page.goto("/");
  const adresse = page.locator(".pa-cta-adresse a[href^='mailto:']");
  await expect(adresse).toBeVisible();
  // Un lien mailto peut ne rien ouvrir (aucun client de messagerie configuré) : l'adresse doit
  // donc se lire à l'œil, à la même taille que le texte courant, pas en mention secondaire.
  const taille = await adresse.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(taille).toBeGreaterThanOrEqual(16);
  await expect(page.locator(".pa-cta-adresse button")).toHaveText("Copier");
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/contact.spec.ts -g "lisible sans interaction" --project=chromium --reporter=line
```

Attendu : ÉCHEC — `.pa-cta-adresse` n'existe pas.

- [ ] **Step 3: Remonter l'adresse dans le bandeau**

`components/CtaBand.tsx` : remplacer le paragraphe `<p className="pa-cta-liens">` par

```tsx
          <p className="pa-cta-adresse">
            <CopyEmail />
          </p>
          <p className="pa-cta-liens">
            {site.liens.github ? (
              <a className="pa-ilink" href={site.liens.github}>
                <TechIcon name="github" size={16} />
                GitHub
              </a>
            ) : null}
            {site.liens.linkedin ? (
              <a className="pa-ilink" href={site.liens.linkedin}>
                LinkedIn
              </a>
            ) : null}
          </p>
```

- [ ] **Step 4: Styler le bloc**

`styles/ajouts.css`, à la suite de la règle `.pa-copymail` :

```css
/* Adresse de contact : lisible sans interaction et à la taille du texte courant. Un lien mailto
   n'ouvre rien quand aucun client de messagerie n'est configuré : l'adresse et le bouton
   « Copier » doivent donc être aussi visibles que le bouton principal. */
.pa-cta-adresse { margin: var(--space-4) 0 0; font-size: 17px; }
.pa-cta-adresse .pa-copymail { gap: var(--space-3); }
.pa-cta-adresse a { color: var(--ink); }
.pa-cta-adresse button { font-size: 13px; }
```

- [ ] **Step 5: Vérifier**

```bash
pnpm exec playwright test tests/e2e/contact.spec.ts --reporter=line
```

Attendu : tous les tests de contact passent, y compris l'ancien test du bouton « Copié ».

- [ ] **Step 6: Revue visuelle**

```bash
bash .work/serve.sh
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/ ".pa-cta" .work/c4-contact-1440.png 1440 dark
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/ ".pa-cta" .work/c4-contact-375.png 375 light
```

Vérifier sur les deux captures que l'adresse se lit d'un coup d'œil et que le bouton « Copier » ne passe pas à la ligne tout seul.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(contact): l'adresse et le bouton Copier passent au premier plan

Un lien mailto n'ouvre rien quand aucun client de messagerie n'est
configuré — le clic tombait dans le vide. L'adresse se lit désormais à la
taille du texte courant, avec son bouton de copie."
```

---

### Task 4 : Remplir la première vue sur grand écran

**Files:**
- Modify: `styles/mise-en-page.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Consumes : la grille `.pa-herogrid` et le cartouche `.pa-frame--accueil` (mise-en-page.css, blocs `@media (min-width: 1440px)` et `(min-width: 1920px)`).
- Produces : aucune nouvelle interface.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans `tests/e2e/responsive.spec.ts`, à l'intérieur du `test.describe("mise en page fluide", …)` :

```ts
  test("sur un grand écran, la première vue porte le haut de page en entier", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const { haut, ecran } = await page.evaluate(() => ({
      haut: document.querySelector(".pa-accueil-haut")!.getBoundingClientRect().height,
      ecran: window.innerHeight,
    }));
    // Mesuré avant ce chantier : 485 px pour 1440 px de fenêtre, soit 34 % — la première vue
    // était surtout du vide. Le haut de page doit occuper au moins 60 % de la hauteur visible.
    expect(haut / ecran, `${Math.round(haut)}px pour ${ecran}px`).toBeGreaterThanOrEqual(0.6);
  });
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/responsive.spec.ts -g "grand écran" --project=chromium --reporter=line
```

Attendu : ÉCHEC avec un rapport proche de `485px pour 1440px`.

- [ ] **Step 3: Agrandir le haut de page au-delà de 1920 px**

`styles/mise-en-page.css`, dans le bloc `@media (min-width: 1920px)`, remplacer son contenu par :

```css
@media (min-width: 1920px) {
  .pa-herogrid { grid-template-columns: minmax(0, 1fr) 460px; gap: 120px; }
  .pa-frame--accueil { width: 460px; }
  .pa-frame--accueil .pa-frame-media { height: 537px; }
  /* Le haut de page respire à proportion de la fenêtre, pas d'une valeur fixe : sur un écran de
     1440 px de haut, un padding de 120 px laissait les deux tiers de la vue vides. */
  .pa-accueil-haut { padding-block: clamp(120px, 9vh, 190px) clamp(120px, 9vh, 190px); }
  .pa-herometa { margin-top: 72px; padding-top: 32px; }
}
```

- [ ] **Step 4: Vérifier**

```bash
pnpm exec playwright test tests/e2e/responsive.spec.ts --reporter=line
```

Attendu : le nouveau test passe, et les tests de débordement et de largeur de contenu restent verts (dont « aucun bloc ne sort de son conteneur » et « le contenu occupe jusqu'à 1 920 px sur un écran de 2 560 px »).

- [ ] **Step 5: Revue visuelle à trois largeurs**

```bash
bash .work/serve.sh
MSYS_NO_PATHCONV=1 node .work/slices.mjs http://localhost:3001/ .work/c4-2560 2560 dark 1440
MSYS_NO_PATHCONV=1 node .work/slices.mjs http://localhost:3001/ .work/c4-1920 1920 dark 1080
MSYS_NO_PATHCONV=1 node .work/slices.mjs http://localhost:3001/ .work/c4-1440 1440 dark 900
```

Regarder la première tranche de chaque largeur : le titre, l'action principale, la ligne de métadonnées et le portrait doivent tenir dans la première vue, sans zone morte sous le portrait.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(accueil): première vue pleine sur grand écran

À 2 560 px, le haut de page n'occupait que 34 % de la fenêtre. Le cartouche
et les marges suivent désormais la hauteur disponible au-delà de 1 920 px."
```

---

### Task 5 : Vérification, revue et fusion

- [ ] Chaîne complète : `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test`.
- [ ] Revue visuelle finale : accueil et « à propos » à 375, 1024, 1440 et 2560 px, en clair et en sombre.
- [ ] Pousser la branche, ouvrir la pull request, **attendre la CI verte** avant toute fusion.
- [ ] Après fusion et déploiement : PageSpeed mobile sur `/` et `/a-propos` — accessibilité, bonnes pratiques et SEO à 100, performance ≥ 95, CLS à 0. Le portrait est le premier vrai fichier image du site : si le LCP se dégrade, réduire le poids des JPEG avant d'aller plus loin.

## Self-Review

- **Couverture de la spec** : §A retrait de PlusUtra → tâche 1 ; §D.1 contact → tâche 3 ; §D.2 portraits → tâche 2 ; §D.3 grand écran → tâche 4 ; §Vérification → tâche 5. Les §B (gabarit des études), §C (UML) et le reste de §A (nouveaux dossiers) relèvent du chantier 4b, qui attend les faits de l'auteur.
- **Aucun espace réservé** : chaque étape porte son code ou sa commande exacte.
- **Cohérence des noms** : `site.portraits.accueil` / `site.portraits.apropos` (tâche 2) sont les seules clés utilisées ; `Frame` garde sa signature `{ feuille, variante }` ; `.pa-cta-adresse` (tâche 3) est utilisé à l'identique dans le composant, le CSS et le test.
- **Vérifié contre le code réel** : `content/projets/*.mdx` portent bien `dossier:` en ligne 5 ; `tests/e2e/projets.spec.ts` attend aujourd'hui 4 cartes et « 4 dossiers » ; `navigation.spec.ts` liste `/projets/plusutra` en ligne 3 ; `Frame.tsx` lit `site.portrait` ; `CtaBand.tsx` place `CopyEmail` dans `.pa-cta-liens` ; le bloc `@media (min-width: 1920px)` de `mise-en-page.css` ne contient aujourd'hui que trois règles.
