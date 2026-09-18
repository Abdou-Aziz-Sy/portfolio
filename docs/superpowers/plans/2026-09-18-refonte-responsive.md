# Chantier 2 — Refonte responsive : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Goal :** faire exploiter au site toute largeur entre 320 et 2 560 px — contenu fluide jusqu'à 1 920 px, texte borné à 68 caractères, typographie fluide, première vue mobile « action d'abord », schéma simplifié lisible sur l'accueil — sans aucun débordement horizontal.

**Architecture :** `styles/plan.css` et `styles/tokens.css` sont **générés** : on ne les touche jamais. La refonte vit dans un nouveau fichier `styles/mise-en-page.css`, importé dans `app/globals.css` **entre** `plan.css` et `ajouts.css`. Conséquence de cet ordre, à garder en tête dans chaque tâche : une règle de `mise-en-page.css` bat une règle de même spécificité de `plan.css` (y compris celles de ses media queries), mais **perd** contre une règle de même spécificité de `ajouts.css`. Les règles de `ajouts.css` qui fixent des tailles par point de rupture pour des éléments rendus fluides doivent donc être **retirées** de `ajouts.css` (tâche 2).

**Tech Stack :** Next 16.3.5, React 19.2.8, TypeScript, Vitest, Playwright (Edge en local, Chromium en CI), pnpm.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-09-17-refonte-responsive-design.md`.
- Ne jamais modifier `styles/plan.css` ni `styles/tokens.css`.
- Dans chaque fichier CSS : règles inconditionnelles **avant** les blocs `@media` (à spécificité égale, la dernière déclaration du fichier gagne).
- Jetons : `--content-max: 1920px`, `--gutter: clamp(16px, 4vw, 96px)`, `--prose-max: 68ch`.
- Points de rupture : 480, 768, 1024, 1440, 1920 px.
- Aucune page ne déborde horizontalement entre 320 et 2 560 px.
- Code, libellés, commentaires et messages de commit en français.
- Cycle TDD dans chaque tâche ; chaque test doit pouvoir échouer (prouver l'échec avant l'implémentation).
- Avant `pnpm build` / `pnpm test:e2e` : aucun serveur sur les ports 3000, 3001, 3100.
- Sous Git Bash : `MSYS_NO_PATHCONV=1` devant toute commande recevant un argument commençant par `/`.
- Lighthouse mobile : accessibilité, bonnes pratiques, SEO à 100 ; CLS à 0.

## Clarifications par rapport à la spec

1. **Boutons du haut de l'accueil.** La maquette validée affichait « Voir les projets » et « CV ». On garde le bouton principal existant (« Voir l'étude de cas UGB Link », preuve la plus forte) et on remplace le secondaire « Me contacter » par le CV, puisque « Me contacter » est désormais dans l'en-tête à toutes les largeurs (chantier 1).
2. **Faits en première vue mobile.** On affiche les **quatre** faits de `site.faits` en grille 2 × 2 compacte (et non trois), et on masque le bandeau de faits principal sous 768 px : aucun fait n'est perdu sur mobile, aucun n'est lu deux fois par un lecteur d'écran.

## Fichiers

- Créer : `styles/mise-en-page.css` — tout le système responsive.
- Créer : `components/diagrams/UgbLinkDiagramSimple.tsx` — schéma à 4 blocs pour l'accueil.
- Créer : `components/DiagramScroller.tsx` — cadre défilant avec indice, focalisable seulement s'il déborde.
- Créer : `tests/e2e/responsive.spec.ts` — tests de largeur, typographie, grilles, première vue.
- Modifier : `app/globals.css`, `styles/ajouts.css`, `app/page.tsx`, `components/FactStrip.tsx`, `components/FeaturedCase.tsx`, `components/mdx.tsx`, `tests/e2e/liens.spec.ts`.

---

### Task 1 : Système de largeur fluide

**Files:**
- Create: `styles/mise-en-page.css`, `tests/e2e/responsive.spec.ts`
- Modify: `app/globals.css`, `tests/e2e/liens.spec.ts`

**Interfaces:**
- Produces: variables CSS `--content-max`, `--gutter`, `--prose-max` (déclarées sur `:root` dans `mise-en-page.css`) ; constante `LARGEURS` exportée par `tests/e2e/responsive.spec.ts`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `tests/e2e/responsive.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { PAGES_TEST } from "./liens.spec";

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

  test("aucune page ne déborde, de 320 à 2 560 px", async ({ page }) => {
    for (const largeur of LARGEURS) {
      await page.setViewportSize({ width: largeur, height: 900 });
      for (const chemin of PAGES_TEST) {
        await page.goto(chemin);
        const m = await page.evaluate(() => ({
          defile: document.documentElement.scrollWidth,
          visible: document.documentElement.clientWidth,
        }));
        expect(m.defile, `${chemin} à ${largeur} px`).toBeLessThanOrEqual(m.visible);
      }
    }
  });
});
```

Vérifier que `main` existe bien dans `app/layout.tsx` (`grep -n "<main" app/layout.tsx`) ; s'il n'existe pas, cibler le premier `.pa-wrap` qui suit l'en-tête (par exemple `page.locator(".pa-wrap").nth(1)`) et l'indiquer dans le rapport.

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium
```

Attendu : ÉCHEC des deux premiers tests (largeur utile 1 104 px environ ; marge de 48 px à 1 440 et 2 560 px). Le troisième peut déjà passer : c'est un garde-fou pour les tâches suivantes.

- [ ] **Step 3: Créer le fichier et l'importer**

`styles/mise-en-page.css` :

```css
/* Système de mise en page fluide (chantier 2).
   Importé entre plan.css (généré) et ajouts.css : bat plan.css à spécificité égale,
   perd contre ajouts.css. Règles inconditionnelles d'abord, media queries ensuite. */

:root {
  --content-max: 1920px;
  --gutter: clamp(16px, 4vw, 96px);
  --prose-max: 68ch;
}

/* Conteneur : le contenu utile atteint 1 920 px ; au-delà, la marge grandit. */
.pa-wrap {
  max-width: calc(var(--content-max) + 2 * var(--gutter));
  padding-inline: var(--gutter);
}
```

`app/globals.css` :

```css
@import "../styles/tokens.css";
@import "../styles/plan.css";
@import "../styles/mise-en-page.css";
@import "../styles/ajouts.css";
```

- [ ] **Step 4: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium
```

Attendu : SUCCÈS des trois tests. Si le test de débordement échoue à une largeur donnée, NE PAS l'affaiblir : noter la page et la largeur dans le rapport et corriger la règle en cause (souvent une grille sans `minmax(0, …)`).

- [ ] **Step 5: Commit**

```bash
git add styles/mise-en-page.css app/globals.css tests/e2e/responsive.spec.ts
git commit -m "feat(mise en page): conteneur fluide jusqu'à 1 920 px et marges adaptatives"
```

---

### Task 2 : Typographie fluide

**Files:**
- Modify: `styles/mise-en-page.css`, `styles/ajouts.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Consumes: `styles/mise-en-page.css` (tâche 1).

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans le `describe` de `tests/e2e/responsive.spec.ts` :

```ts
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
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium -g "grandissent"
```

Attendu : ÉCHEC (38 px à 375, 60 px à 2 560).

- [ ] **Step 3: Implémenter**

Ajouter à `styles/mise-en-page.css`, **avant** tout bloc `@media` du fichier. Les pentes interpolent linéairement entre 375 et 2 560 px (pente = écart / 2 185 px) :

```css
/* Typographie fluide : interpolation linéaire entre 375 px et 2 560 px. */
.pa-hero    { font-size: clamp(34px, 25.42px + 2.288vw, 84px);  line-height: 1.1; }
.pa-hero-xl { font-size: clamp(64px, 47.52px + 4.394vw, 160px); line-height: 1; }
.pa-h1      { font-size: clamp(32px, 26.51px + 1.465vw, 64px);  line-height: 1.12; }
.pa-h2      { font-size: clamp(24px, 21.25px + 0.732vw, 40px);  line-height: 1.18; }
.pa-cta h2  { font-size: clamp(34px, 28.85px + 1.373vw, 64px);  line-height: 1.12; }
.pa-lead    { font-size: clamp(18px, 17.31px + 0.183vw, 22px);  line-height: 1.55; }
.pa         { font-size: clamp(16px, 15.66px + 0.092vw, 18px);  line-height: 1.6; }
```

Puis retirer de `styles/ajouts.css` les règles qui, venant après, écraseraient ces valeurs :
- la règle inconditionnelle `.pa-hero-xl { font-size: 120px; line-height: 120px; }` ;
- dans `@media (max-width: 1023px)` : `.pa-hero-xl { … }` ;
- dans `@media (max-width: 767px)` : `.pa-hero-xl { … }`, `.pa-h1 { … }`, `.pa-cta h2 { … }`.

Vérifier par `grep -n "pa-hero-xl\|pa-h1\|pa-cta h2\|pa-hero {" styles/ajouts.css` qu'il n'en reste aucune.

- [ ] **Step 4: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium
```

Attendu : SUCCÈS, y compris le test de débordement (un titre plus grand peut faire déborder un mot long à 320 px : si c'est le cas, ajouter `overflow-wrap: anywhere;` à `.pa-hero-xl` plutôt que réduire la taille).

- [ ] **Step 5: Commit**

```bash
git add styles/mise-en-page.css styles/ajouts.css tests/e2e/responsive.spec.ts
git commit -m "feat(typographie): titres et texte courant fluides entre 375 et 2 560 px"
```

---

### Task 3 : Grilles adaptatives (projets, stack, recommandations, domaines)

**Files:**
- Modify: `styles/mise-en-page.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Consumes: `styles/mise-en-page.css`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter dans le `describe` :

```ts
  async function colonnes(page: import("@playwright/test").Page, selecteur: string) {
    return page.locator(selecteur).first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
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
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium -g "quatre colonnes|deux colonnes"
```

Attendu : ÉCHEC (3 colonnes à 1 920 px ; 1 colonne pour les domaines à 900 px).

- [ ] **Step 3: Implémenter**

Ajouter à `styles/mise-en-page.css`, dans la partie inconditionnelle :

```css
/* Grilles : le nombre de colonnes dépend de la place, borné à 4. */
.pa-grid {
  grid-template-columns: repeat(auto-fill, minmax(max(280px, calc((100% - 3 * var(--space-5)) / 4)), 1fr));
}
.pa-grid--2 { grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
.pa-techs { grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); }
```

Explication du `max(280px, …)` : une carte fait au moins 280 px, et au moins un quart de la ligne, ce qui borne la grille à quatre colonnes. Nombre de colonnes = plancher((largeur utile + 24) / (minimum + 24)) :
- 1 024 px → largeur utile ≈ 942 px → plancher(966 / 304) = 3 ;
- 1 920 px → largeur utile ≈ 1 766 px, minimum ≈ 424 px → 4 ;
- 375 px → 343 px → 1 ; 320 px → 288 px → 1.

Avec 300 px au lieu de 280 px, l'écran de 1 024 px n'aurait que 2 colonnes. Si la grille déborde à 320 px, remplacer `280px` par `min(100%, 280px)`.

Puis, à la fin du fichier (bloc `@media`) :

```css
@media (min-width: 768px) and (max-width: 1023px) {
  .pa-domains { grid-template-columns: 1fr 1fr; }
  .pa-domain + .pa-domain { border-top: 0; border-left: 0; }
  .pa-domain:nth-child(2) { border-left: 1px solid var(--line); }
  .pa-domain:nth-child(3) { grid-column: 1 / -1; border-top: 1px solid var(--line); }
}
```

Vérifier dans `components/DomainColumn.tsx` que les domaines sont bien les enfants directs de `.pa-domains` et qu'il y en a trois (`site.domaines`).

- [ ] **Step 4: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium
```

Attendu : SUCCÈS de tout le fichier.

- [ ] **Step 5: Commit**

```bash
git add styles/mise-en-page.css tests/e2e/responsive.spec.ts
git commit -m "feat(grilles): colonnes adaptatives jusqu'à quatre, domaines sur deux colonnes en tablette"
```

---

### Task 4 : Haut de l'accueil — « action d'abord » sur mobile

**Files:**
- Modify: `app/page.tsx:26-78` et `:98-100`, `components/FactStrip.tsx`, `styles/mise-en-page.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Consumes: `site.faits`, `site.cv` (`content/site.ts`), `Button`, `CvLabel` (`components/Button.tsx`).
- Produces: `FactStrip` accepte `variante?: "bandeau" | "compacte"` (défaut `"bandeau"`).

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à `tests/e2e/responsive.spec.ts`, **hors** du `describe` existant (ce test tourne sur le projet `mobile`) :

```ts
test.describe("première vue mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("nom, titre, action principale et faits sont visibles sans défiler", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hauteur = 812;
    for (const cible of [
      page.getByTestId("surtitre-identite"),
      page.locator("h1.pa-hero"),
      page.getByTestId("action-principale"),
      page.getByTestId("faits-hero"),
    ]) {
      const boite = await cible.boundingBox();
      expect(boite, "élément présent").not.toBeNull();
      expect(boite!.y + boite!.height).toBeLessThanOrEqual(hauteur);
    }
  });

  test("chaque fait n'est exposé qu'une fois", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("definition").filter({ hasText: "260" })).toHaveCount(1);
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=mobile
```

Attendu : ÉCHEC (`action-principale` et `faits-hero` introuvables).

- [ ] **Step 3: Adapter `FactStrip`**

`components/FactStrip.tsx` :

```tsx
type Fait = { valeur: string; unite?: string; libelle: string };

/**
 * Chiffres clés. La variante « compacte » est la version de première vue mobile ;
 * la variante « bandeau » est la section de l'accueil. Une seule des deux est affichée
 * à une largeur donnée (styles/mise-en-page.css), donc chaque fait n'est lu qu'une fois.
 */
export function FactStrip({ faits, variante = "bandeau" }: { faits: Fait[]; variante?: "bandeau" | "compacte" }) {
  return (
    <dl
      className={variante === "compacte" ? "pa-facts pa-facts--hero" : "pa-facts pa-facts--bandeau"}
      style={{ margin: 0 }}
      data-testid={variante === "compacte" ? "faits-hero" : undefined}
    >
      {faits.map((f) => (
        <div className="pa-fact" key={f.libelle}>
          <dt className="pa-sr">{f.libelle}</dt>
          <dd style={{ margin: 0 }}>
            <b>
              {f.valeur}
              {f.unite ? <small>{f.unite}</small> : null}
            </b>
            <span aria-hidden="true">{f.libelle}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: Restructurer le haut de l'accueil**

Dans `app/page.tsx` :

1. Remplacer `<section className="pa-wrap" style={{ paddingTop: 88, paddingBottom: 96 }}>` par `<section className="pa-wrap pa-accueil-haut">`.
2. Dans le `<h1>`, envelopper la première phrase : `<span className="pa-hero-intro">Ingénieur logiciel à Dakar. </span>Je construis des…`, en conservant tel quel le reste du titre (liens, `pa-em`).
3. Si le titre contient encore une proposition « et j'écris sur ce que j'apprends » affichée même sans article publié, la rendre conditionnelle : elle n'apparaît que si `articles.length > 0` ; sinon la phrase se termine par « … avant de les coder. » (exigence B.6 de la spec du chantier 1). Si elle est déjà conditionnelle, ne rien changer.
4. Déplacer le bloc `<div className="pa-actions">…</div>` de `.pa-herometa` vers la colonne de texte, juste après le `<h1>`, avec ces boutons :

```tsx
            <div className="pa-actions pa-actions-hero">
              {vedette ? (
                <Button href={`/projets/${vedette.slug}`} arrow data-testid="action-principale">
                  Voir l&apos;étude de cas {vedette.titre}
                </Button>
              ) : (
                <Button href="/projets" arrow data-testid="action-principale">
                  Voir les projets
                </Button>
              )}
              <Button href={site.cv.href} variant="secondary" download={site.cv.fichier}>
                <CvLabel />
              </Button>
            </div>
            <FactStrip faits={site.faits} variante="compacte" />
```

`Button` ne transmet pas encore `data-testid` : ajouter à ses props `"data-testid"?: string` et le passer au `<a>` et au `<Link>`. Importer `CvLabel` depuis `@/components/Button`.

5. `.pa-herometa` ne garde que la ligne de métadonnées (`site.ville`, `site.diplome`, disponibilité).
6. Donner à la section des faits de la page la classe `pa-faits-section` : `<section aria-label="Faits" className="pa-faits-section">`.

- [ ] **Step 5: Styles**

Dans `styles/mise-en-page.css`, partie inconditionnelle :

```css
/* Haut de l'accueil */
.pa-accueil-haut { padding-block: clamp(32px, 4vw + 16px, 120px) clamp(40px, 4vw + 24px, 120px); }
.pa-actions-hero { margin-top: var(--space-6); }
.pa-facts--hero { display: none; }
```

Dans un bloc `@media (max-width: 767px)` en fin de fichier :

```css
@media (max-width: 767px) {
  .pa-hero-intro { display: none; }
  .pa-herofig { order: 1; }
  .pa-actions-hero { margin-top: var(--space-5); }
  .pa-facts--hero { display: grid; grid-template-columns: 1fr 1fr; margin-top: var(--space-5); border-top: 1px solid var(--line-strong); }
  .pa-facts--hero .pa-fact { padding: var(--space-3) var(--space-3) var(--space-3) 0; }
  .pa-facts--hero .pa-fact b { font-size: 26px; line-height: 30px; }
  .pa-facts--hero .pa-fact span { margin-top: 2px; font-size: 12px; line-height: 16px; }
  .pa-faits-section { display: none; }
}
```

Attention : `styles/ajouts.css` (importé après) contient `.pa-herofig { order: -1; padding-top: 0; }` dans son bloc 767 px, qui l'emporterait. Retirer `order: -1` de cette règle dans `ajouts.css` (garder `padding-top: 0`).

- [ ] **Step 6: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts
pnpm test:e2e tests/e2e/identite.spec.ts tests/e2e/navigation.spec.ts
```

Attendu : SUCCÈS sur les deux projets ; les tests d'identité et de navigation existants restent verts.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/FactStrip.tsx components/Button.tsx styles/mise-en-page.css styles/ajouts.css tests/e2e/responsive.spec.ts
git commit -m "feat(accueil): première vue mobile avec action principale, CV et chiffres clés"
```

---

### Task 5 : Haut de l'accueil — tablette et grands écrans, bandeau « Présentation »

**Files:**
- Modify: `styles/mise-en-page.css`, `styles/ajouts.css`
- Test: `tests/e2e/responsive.spec.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Dans le `describe` « mise en page fluide » :

```ts
  test("le haut de l'accueil passe sur une colonne sous 1 024 px", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto("/");
    expect(await colonnes(page, ".pa-herogrid")).toBe(1);
  });

  test("le cartouche grandit sur grand écran", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const largeur = await page.locator(".pa-frame--accueil").evaluate((el) => el.getBoundingClientRect().width);
    expect(largeur).toBeGreaterThanOrEqual(320);
  });

  test("le bandeau Présentation s'aligne sur la grille de contenu", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    const [bandeau, contenu] = await Promise.all([
      page.locator(".pa-intro > :first-child").evaluate((el) => el.getBoundingClientRect().left),
      page.locator("main .pa-wrap").first().evaluate((el) => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)),
    ]);
    expect(Math.abs(bandeau - contenu)).toBeLessThanOrEqual(1);
  });
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium -g "une colonne|cartouche|Présentation"
```

Attendu : ÉCHEC des trois.

- [ ] **Step 3: Implémenter**

Dans `styles/mise-en-page.css`, partie inconditionnelle :

```css
/* Le bandeau Présentation est pleine largeur : son contenu s'aligne sur celui de .pa-wrap. */
.pa-intro {
  padding-inline: max(var(--gutter), (100% - var(--content-max)) / 2);
}
```

Dans les blocs `@media` en fin de fichier :

```css
@media (max-width: 1023px) {
  .pa-herogrid { grid-template-columns: minmax(0, 1fr); gap: var(--space-6); }
}
@media (min-width: 1440px) {
  .pa-herogrid { grid-template-columns: minmax(0, 1fr) 320px; gap: 96px; }
  .pa-frame--accueil { width: 320px; }
  .pa-frame--accueil .pa-frame-media { height: 370px; }
}
@media (min-width: 1920px) {
  .pa-herogrid { grid-template-columns: minmax(0, 1fr) 360px; }
  .pa-frame--accueil { width: 360px; }
  .pa-frame--accueil .pa-frame-media { height: 420px; }
}
```

`styles/ajouts.css` définit `.pa-herogrid`, `.pa-frame--accueil` et `.pa-frame--accueil .pa-frame-media` sans media query, et les redéfinit dans son bloc 767 px : comme `ajouts.css` est importé après, ces règles l'emportent sur celles de `mise-en-page.css`. Déplacer vers `mise-en-page.css` (partie inconditionnelle, puis bloc 767 px) les règles `.pa-herogrid`, `.pa-frame--accueil`, `.pa-frame--accueil .pa-frame-media`, et les retirer de `ajouts.css`. Contrôler avec `grep -n "pa-herogrid\|pa-frame--accueil" styles/*.css`.

Le rapport doit indiquer la valeur `padding-inline` calculée de `.pa-intro` à 375, 1 440 et 2 560 px.

- [ ] **Step 4: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add styles/mise-en-page.css styles/ajouts.css tests/e2e/responsive.spec.ts
git commit -m "feat(accueil): haut de page sur une colonne en tablette, cartouche agrandi sur grand écran"
```

---

### Task 6 : Schéma simplifié sur la carte vedette

**Files:**
- Create: `components/diagrams/UgbLinkDiagramSimple.tsx`
- Modify: `components/FeaturedCase.tsx:34-43`, `styles/mise-en-page.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Produces: `<UgbLinkDiagramSimple />` — SVG sans props, `role="img"`, avec titre accessible.

- [ ] **Step 1: Écrire le test qui échoue**

Hors de tout `describe` à `skip` (doit tourner sur les deux projets) :

```ts
/** Taille de police réellement rendue d'un texte SVG : taille déclarée × échelle du SVG. */
async function taillesRendues(svg: import("@playwright/test").Locator, selecteur = "text") {
  return svg.evaluate((el, sel) => {
    const s = el as SVGSVGElement;
    const echelle = s.getBoundingClientRect().width / s.viewBox.baseVal.width;
    return Array.from(s.querySelectorAll(sel)).map((t) => parseFloat(getComputedStyle(t).fontSize) * echelle);
  }, selecteur);
}

test("le schéma de la carte vedette reste lisible (texte d'au moins 11 px)", async ({ page }) => {
  await page.goto("/");
  const tailles = await taillesRendues(page.locator(".pa-feature-fig svg").first());
  expect(tailles.length).toBeGreaterThan(0);
  expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
  await expect(page.getByRole("link", { name: /Voir le schéma complet/ })).toHaveAttribute(
    "href",
    "/projets/ugb-link#architecture",
  );
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts -g "reste lisible"
```

Attendu : ÉCHEC (hauteur de texte rendu d'environ 5 à 8 px sur mobile ; lien absent).

- [ ] **Step 3: Créer le composant**

Avant d'écrire les libellés, relire le titre accessible de `components/diagrams/UgbLinkDiagram.tsx` : le schéma simplifié ne doit rien affirmer que le schéma complet ne dit pas (Nginx est sur la machine virtuelle, l'OCR tourne dans l'API, le modèle de langage dans le conteneur `ollama`).

`components/diagrams/UgbLinkDiagramSimple.tsx` :

```tsx
/**
 * Version simplifiée du schéma d'UGB Link, pour la carte vedette de l'accueil :
 * quatre blocs lisibles à toute largeur. Le schéma complet vit dans l'étude de cas.
 */
const BLOCS = [
  { x: 8, y: 8, titre: "Navigateur", sous: "React" },
  { x: 184, y: 8, titre: "API Express", sous: "derrière Nginx · OCR" },
  { x: 8, y: 112, titre: "PostgreSQL", sous: "Redis · MinIO" },
  { x: 184, y: 112, titre: "Ollama", sous: "modèle de langage" },
];

export function UgbLinkDiagramSimple() {
  return (
    <svg viewBox="0 0 360 200" role="img" aria-labelledby="ugb-simple-titre" className="pa-schema-simple">
      <title id="ugb-simple-titre">
        Vue simplifiée d&apos;UGB Link : le navigateur appelle l&apos;API Express, placée derrière Nginx, qui
        s&apos;appuie sur PostgreSQL, Redis et MinIO, et sur un modèle de langage servi par Ollama.
      </title>
      {BLOCS.map((b, i) => (
        <g key={b.titre}>
          <rect className={i === 1 ? "d-box-acc" : "d-box"} x={b.x} y={b.y} width="168" height="80" />
          <text className="d-t" x={b.x + 14} y={b.y + 34} style={{ fontSize: 17 }}>
            {b.titre}
          </text>
          <text className="d-s" x={b.x + 14} y={b.y + 58} style={{ fontSize: 14 }}>
            {b.sous}
          </text>
        </g>
      ))}
      <path className="d-flow" d="M176 48 L184 48" />
      <path className="d-flow" d="M268 88 L268 112" />
      <path className="d-flow" d="M184 152 L176 152" />
    </svg>
  );
}
```

Les classes `d-box`, `d-box-acc`, `d-t`, `d-s`, `d-flow` existent dans `styles/plan.css` (vérifié) ; le `style={{ fontSize }}` en ligne l'emporte sur la taille de la classe. Calcul de lisibilité à 375 px : la figure mesure environ 375 − 2 × 16 (marges) − 2 (bordure) − 2 × 24 (remplissage de `.pa-feature-fig`) = 293 px, soit une échelle de 293 / 360 ≈ 0,81 ; un sous-titre de 14 unités rend donc environ 11,4 px. Si le test mesure moins de 11 px, raccourcir les libellés et augmenter `fontSize` plutôt que réduire le viewBox.

- [ ] **Step 4: Brancher dans la carte vedette**

Dans `components/FeaturedCase.tsx`, remplacer le bloc `{avecSchemaComplet ? (<div className="pa-diagram-scroll" …><UgbLinkDiagram /></div>) : …}` par :

```tsx
          {avecSchemaComplet ? (
            <UgbLinkDiagramSimple />
          ) : (
            <MiniDiagram boites={projet.miniSchema} label={`Schéma de ${projet.titre}`} />
          )}
```

et, dans la légende, pour UGB Link, ajouter après la `MetaLine` :

```tsx
            {avecSchemaComplet ? (
              <Link className="pa-link" href={`/projets/${projet.slug}#architecture`}>
                Voir le schéma complet →
              </Link>
            ) : null}
```

Mettre à jour les imports (retirer `UgbLinkDiagram`, ajouter `UgbLinkDiagramSimple` et `Link` de `next/link`). Vérifier que l'ancre `#architecture` existe dans l'étude de cas (`grep -n "architecture" content/projets/ugb-link.mdx components/mdx.tsx`).

Dans `styles/mise-en-page.css`, partie inconditionnelle :

```css
.pa-schema-simple { display: block; width: 100%; max-width: 560px; height: auto; margin-inline: auto; }
```

- [ ] **Step 5: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts tests/e2e/liens.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add components/diagrams/UgbLinkDiagramSimple.tsx components/FeaturedCase.tsx styles/mise-en-page.css tests/e2e/responsive.spec.ts
git commit -m "feat(accueil): schéma simplifié et lisible sur la carte vedette"
```

---

### Task 7 : Schéma complet défilant avec indice dans l'étude de cas

**Files:**
- Create: `components/DiagramScroller.tsx`
- Modify: `components/mdx.tsx:60-70`, `styles/mise-en-page.css`, `styles/ajouts.css`
- Test: `tests/e2e/responsive.spec.ts`

**Interfaces:**
- Produces: `<DiagramScroller label: string>{children}</DiagramScroller>` — composant client.

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
test.describe("schéma complet de l'étude de cas", () => {
  test("sur mobile, il défile dans son cadre, avec un indice, et reçoit le focus", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile uniquement");
    await page.goto("/projets/ugb-link#architecture");
    const cadre = page.getByTestId("schema-defilant");
    await expect(cadre).toHaveAttribute("tabindex", "0");
    await expect(cadre).toHaveAttribute("role", "region");
    await expect(cadre).toHaveAttribute("data-deborde", "true");
    await expect(page.getByTestId("indice-defilement")).toBeVisible();
    // Libellés principaux des blocs (.d-t, 14 unités) : au moins 11 px rendus.
    const tailles = await taillesRendues(cadre.locator("svg").first(), ".d-t");
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
  });

  test("sur ordinateur, il tient dans la page et n'est pas focalisable", async ({ page, isMobile }) => {
    test.skip(isMobile, "bureau uniquement");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projets/ugb-link#architecture");
    const cadre = page.getByTestId("schema-defilant");
    await expect(cadre).toHaveAttribute("data-deborde", "false");
    await expect(cadre).not.toHaveAttribute("tabindex", "0");
    await expect(page.getByTestId("indice-defilement")).toBeHidden();
  });
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts -g "schéma complet"
```

Attendu : ÉCHEC (`schema-defilant` introuvable).

- [ ] **Step 3: Créer le composant**

`components/DiagramScroller.tsx` :

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Cadre d'un schéma large. Sur petit écran, le schéma garde une taille lisible et défile
 * horizontalement ; un dégradé et une flèche signalent qu'il reste du contenu à droite.
 * Le cadre ne devient focalisable (pour le défilement au clavier) que s'il déborde réellement.
 */
export function DiagramScroller({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [deborde, setDeborde] = useState(false);
  const [finAtteinte, setFinAtteinte] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => {
      setDeborde(el.scrollWidth > el.clientWidth + 1);
      setFinAtteinte(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    el.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      observateur.disconnect();
      el.removeEventListener("scroll", mesurer);
    };
  }, []);

  return (
    <div className="pa-schema-cadre">
      <div
        ref={ref}
        className="pa-diagram-scroll"
        data-testid="schema-defilant"
        data-deborde={deborde ? "true" : "false"}
        tabIndex={deborde ? 0 : undefined}
        role={deborde ? "region" : undefined}
        aria-label={deborde ? label : undefined}
      >
        {children}
      </div>
      <span className="pa-schema-indice" data-testid="indice-defilement" aria-hidden="true" hidden={!deborde || finAtteinte}>
        →
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Brancher et styler**

Dans `components/mdx.tsx`, remplacer `<div className="pa-diagram-scroll" tabIndex={0} role="region" aria-label="Schéma d'architecture, défilable"><UgbLinkDiagram /></div>` par :

```tsx
      <DiagramScroller label="Schéma d'architecture, défilable">
        <UgbLinkDiagram />
      </DiagramScroller>
```

avec `import { DiagramScroller } from "@/components/DiagramScroller";`.

Dans `styles/mise-en-page.css`, partie inconditionnelle :

```css
/* Schéma large : défilement dans son cadre, avec un indice tant qu'il reste du contenu à droite. */
.pa-schema-cadre { position: relative; }
.pa-schema-indice {
  position: absolute; top: 0; right: 0; bottom: 0; width: 48px;
  display: flex; align-items: center; justify-content: flex-end; padding-right: 6px;
  background: linear-gradient(90deg, transparent, var(--surface));
  color: var(--accent); font-size: 20px; pointer-events: none;
}
.pa-schema-indice[hidden] { display: none; }
```

Dans le bloc `@media (max-width: 767px)` de `mise-en-page.css` :

```css
  .pa-diagram-scroll { overflow-x: auto; }
  .pa-diagram-scroll svg { min-width: 800px; }
```

et retirer de `styles/ajouts.css` (bloc 767 px) les deux règles équivalentes `.pa-diagram-scroll { overflow-x: auto; }` et `.pa-diagram-scroll svg { min-width: 760px; }`, qui l'emporteraient. Calcul : le viewBox fait 980 unités et les libellés de blocs `.d-t` 14 unités (`styles/plan.css:148`) ; à 800 px de large, l'échelle vaut 0,816 et un libellé rend 11,4 px (à 760 px : 10,9 px, trop petit). Les textes secondaires `.d-s` et `.d-z` (10,5 unités) restent sous 11 px : c'est accepté, ce sont des annotations, et le schéma complet est aussi décrit par son titre accessible.

Le test utilise `taillesRendues`, défini à la tâche 6 dans le même fichier : s'assurer qu'il est déclaré au niveau du module, avant les deux `describe`.

- [ ] **Step 5: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts
pnpm test:e2e tests/e2e/projets.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add components/DiagramScroller.tsx components/mdx.tsx styles/mise-en-page.css styles/ajouts.css tests/e2e/responsive.spec.ts
git commit -m "feat(étude de cas): schéma complet lisible, défilant avec indice sur mobile"
```

---

### Task 8 : Texte courant borné, pages secondaires, écrans de faible hauteur

**Files:**
- Modify: `styles/mise-en-page.css`
- Test: `tests/e2e/responsive.spec.ts`

- [ ] **Step 1: Écrire les tests qui échouent**

Dans le `describe` « mise en page fluide » :

```ts
  test("les paragraphes ne dépassent pas 68 caractères par ligne sur grand écran", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    for (const chemin of ["/projets/ugb-link", "/a-propos"]) {
      await page.goto(chemin);
      const depasse = await page.evaluate(() => {
        const ch = (el: Element) => {
          const sonde = document.createElement("span");
          sonde.textContent = "0";
          sonde.style.cssText = "position:absolute;visibility:hidden;font:inherit";
          el.appendChild(sonde);
          const l = sonde.getBoundingClientRect().width;
          sonde.remove();
          return l;
        };
        return Array.from(document.querySelectorAll(".pa-casebody > p, .pa-prose > p"))
          .filter((p) => p.getBoundingClientRect().width > 68 * ch(p) + 2)
          .map((p) => (p.textContent ?? "").slice(0, 40));
      });
      expect(depasse, chemin).toEqual([]);
    }
  });

  test("l'en-tête n'est plus collant sur un écran de faible hauteur", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 450 });
    await page.goto("/");
    expect(await page.locator(".pa-nav").evaluate((el) => getComputedStyle(el).position)).toBe("static");
  });
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts --project=chromium -g "68 caractères|faible hauteur"
```

Attendu : ÉCHEC au moins pour la faible hauteur (en-tête `sticky`). Si le test des 68 caractères passe déjà sur les deux pages, l'indiquer dans le rapport : il sert alors de garde-fou.

- [ ] **Step 3: Implémenter**

Dans `styles/mise-en-page.css`, partie inconditionnelle :

```css
/* Texte courant : jamais plus de 68 caractères par ligne, quelle que soit la largeur. */
.pa-casebody > p, .pa-casebody > ul, .pa-casebody > ol,
.pa-prose > p, .pa-prose > ul, .pa-prose > ol { max-width: var(--prose-max); }
```

En fin de fichier :

```css
@media (max-height: 500px) {
  .pa-nav { position: static; }
}
```

- [ ] **Step 4: Relancer et vérifier le succès**

```bash
pnpm test:e2e tests/e2e/responsive.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add styles/mise-en-page.css tests/e2e/responsive.spec.ts
git commit -m "feat(mise en page): texte borné à 68 caractères et en-tête non collant sur faible hauteur"
```

---

### Task 9 : Vérification complète et revue visuelle

**Files:** aucun (sauf correctifs découverts, décrits dans le rapport).

- [ ] **Step 1: Chaîne complète**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

Attendu : tout vert.

- [ ] **Step 2: Captures aux sept largeurs**

Serveur : `bash .work/serve.sh` (port 3001). Pour chaque largeur de `LARGEURS` et chaque thème (`dark`, `light`), capturer `/`, `/projets`, `/projets/ugb-link`, `/a-propos` :

```bash
node .work/slices.mjs http://localhost:3001/ r-accueil-1920 1920 dark 1080
```

Regarder chaque image (outil Read). Vérifier : aucun débordement ni chevauchement ; texte lisible ; première vue mobile conforme ; quatre colonnes de projets à 1 920 px ; schéma simplifié lisible ; indice de défilement visible sur mobile ; bandeau « Présentation » aligné.

- [ ] **Step 3: Lighthouse**

```bash
bash .work/lh.sh / 1
bash .work/lh.sh /projets 1
bash .work/lh.sh /projets/ugb-link 1
```

Attendu : accessibilité, bonnes pratiques et SEO à 100 ; CLS à 0. Arrêter le serveur ensuite.

- [ ] **Step 4: Commit** seulement si des fichiers suivis ont changé.

---

## Self-Review

- **Couverture de la spec** : A (emplacement, jetons, breakout, points de rupture, grilles, typographie, faible hauteur) → tâches 1, 2, 3, 8 ; B accueil mobile → tâche 4 ; accueil < 1 024 / ≥ 1 440, domaines, bandeau → tâches 3 et 5 ; schémas → tâches 6 et 7 ; études de cas (sommaire collant existant, texte borné) → tâche 8 ; pages secondaires → tâches 1, 2, 3, 8 (règles globales) ; C vérification → tâches 1 à 9.
- **Vérification contre le code réel** (leçon du chantier 1) : chaque règle de `mise-en-page.css` qui vise un sélecteur aussi défini dans `ajouts.css` s'accompagne d'une étape qui retire la règle concurrente de `ajouts.css` (tâches 2, 4, 5, 7) ; les fichiers de test vont dans `tests/e2e/` (convention vérifiée) ; `PAGES_TEST` est bien exporté par `tests/e2e/liens.spec.ts` (chantier 1, tâche 1).
- **Types** : `FactStrip` gagne `variante` avec une valeur par défaut, donc les appels existants restent valides ; `Button` gagne `data-testid` optionnel ; `DiagramScroller` et `UgbLinkDiagramSimple` sont définis avant usage.
