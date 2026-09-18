# Chantier 1 — Corrections de l'audit UI/UX : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Goal :** corriger les défauts relevés par l'audit indépendant du 17/09 (débordement mobile bloquant, identité absente, indicateur faux, défauts d'interaction et d'accessibilité) sans toucher à la mise en page générale, qui relève du chantier 2.

**Architecture :** projet Next.js 16 (App Router, React 19, TypeScript). `styles/tokens.css` et `styles/plan.css` sont **générés** et ne doivent jamais être modifiés à la main ; toute règle nouvelle va dans `styles/ajouts.css`. Tests unitaires avec Vitest (`tests/`), tests de bout en bout avec Playwright (`tests/e2e/`, projets `chromium` et `mobile`).

**Tech Stack :** Next 16.3.5, React 19.2.8, TypeScript, Vitest, Playwright (Edge en local, Chromium en CI), pnpm.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-09-17-corrections-audit-design.md`.
- Ne jamais modifier `styles/plan.css` ni `styles/tokens.css` (fichiers générés). Ajouts dans `styles/ajouts.css`.
- Interface et code en français (noms de variables, libellés, messages de commit).
- Chaque tâche suit le cycle TDD : test qui échoue → implémentation minimale → test qui passe → commit.
- Commandes : `pnpm test` (Vitest), `pnpm test:e2e` (Playwright), `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- Avant tout `pnpm build` ou `pnpm test:e2e`, arrêter un éventuel serveur `next start` (port 3001 ou 3100).
- Sous Git Bash, préfixer par `MSYS_NO_PATHCONV=1` toute commande recevant un argument commençant par `/`.
- Aucune régression : accessibilité Lighthouse à 100, CLS à 0.
- Les faits publiés doivent rester vrais (voir `docs/superpowers/HANDOFF-2026-09-17.md`).

---

### Task 1 : Débordement horizontal sur mobile

**Files:**
- Modify: `styles/ajouts.css`
- Test: `tests/e2e/liens.spec.ts:18-24`

**Interfaces:**
- Consumes: rien.
- Produces: `PAGES_TEST` exporté depuis `tests/e2e/liens.spec.ts` (liste des chemins testés), réutilisé par la tâche 12.

- [ ] **Step 1: Réécrire le test de débordement pour qu'il détecte le défaut**

Dans `tests/e2e/liens.spec.ts`, remplacer la constante `PAGES` et le test `les pages ne défilent pas horizontalement` par :

```ts
export const PAGES_TEST = [
  "/",
  "/projets",
  "/projets/ugb-link",
  "/projets/gamecupsn",
  "/projets/hackathon-mcn",
  "/projets/plusutra",
  "/a-propos",
  "/page-qui-nexiste-pas",
];

const PAGES = PAGES_TEST.filter((c) => c !== "/page-qui-nexiste-pas");

test("les pages ne défilent pas horizontalement", async ({ page }) => {
  for (const chemin of PAGES_TEST) {
    await page.goto(chemin);
    const mesure = await page.evaluate(() => ({
      defile: document.documentElement.scrollWidth,
      visible: document.documentElement.clientWidth,
    }));
    // clientWidth, et non innerWidth : en émulation mobile, innerWidth grandit avec la page
    // et le test ne peut jamais échouer.
    expect(mesure.defile, `${chemin} (${mesure.defile} > ${mesure.visible})`).toBeLessThanOrEqual(mesure.visible);
  }
});
```

Vérifier que les slugs `hackathon-mcn` et `plusutra` existent : `ls content/projets/`. Si un slug diffère, utiliser le nom réel du fichier `.mdx`.

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -- --project=mobile -g "ne défilent pas horizontalement"
```

Attendu : ÉCHEC sur `/` avec un écart d'environ `825 > 412`.

- [ ] **Step 3: Corriger la grille qui s'élargit**

Dans `styles/ajouts.css`, à la fin du fichier (hors de toute media query) :

```css
/* Une grille dont une piste contient un schéma large doit pouvoir rétrécir :
   sans minmax(0, …), la piste prend la largeur minimale du contenu (760 px)
   et élargit toute la page. */
.pa-feature { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
.pa-feature > * { min-width: 0; }
.pa-diagram-scroll { max-width: 100%; }
```

Et dans le bloc `@media (max-width: 1023px)` puis `@media (max-width: 767px)` du même fichier, ajouter :

```css
  .pa-feature { grid-template-columns: minmax(0, 1fr); }
```

- [ ] **Step 4: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "ne défilent pas horizontalement"
```

Attendu : SUCCÈS sur les deux projets (`chromium` et `mobile`).

- [ ] **Step 5: Commit**

```bash
git add styles/ajouts.css tests/e2e/liens.spec.ts
git commit -m "fix(accueil): supprime le débordement horizontal sur mobile et fiabilise son test"
```

---

### Task 2 : Nom visible (surtitre et logo)

**Files:**
- Create: `components/Wordmark.tsx`
- Modify: `components/Navigation.tsx:16-20`, `components/Footer.tsx:9-12`, `app/page.tsx:28-30`, `styles/ajouts.css`
- Test: `tests/e2e/identite.spec.ts` (créer)

**Interfaces:**
- Consumes: `site.nom`, `site.initiales` (`content/site.ts`).
- Produces: `<Wordmark />` — composant serveur, sans props, rendant le lien vers `/` avec le nom complet (≥ 768 px) et les initiales (< 768 px).

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/e2e/identite.spec.ts` :

```ts
import { expect, test } from "@playwright/test";

test("le nom complet est visible en haut de l'accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Abdou Aziz Sy");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Ingénieur logiciel");
});

test("le logo annonce le nom complet aux lecteurs d'écran", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("banner").getByRole("link", { name: /Abdou Aziz Sy/ });
  await expect(logo).toBeVisible();
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -g "identite|nom complet|logo annonce"
```

Attendu : ÉCHEC, `surtitre-identite` introuvable.

- [ ] **Step 3: Créer le composant Wordmark**

`components/Wordmark.tsx` :

```tsx
import Link from "next/link";
import { site } from "@/content/site";

/**
 * Logo du site. Le nom complet s'affiche à partir de 768 px, les initiales en dessous.
 * Le nom accessible reprend le texte visible le plus complet (WCAG 2.5.3).
 */
export function Wordmark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Link className={`pa-mark ${className ?? ""}`.trim()} href={`/`} style={style}>
      <span className="pa-mark-court" aria-hidden="true">
        {site.initiales}
        <i>.</i>
      </span>
      <span className="pa-mark-long">{site.nom}</span>
    </Link>
  );
}
```

- [ ] **Step 4: Brancher le composant et ajouter le surtitre**

Dans `components/Navigation.tsx`, remplacer le bloc `<Link className="pa-mark" …>…</Link>` par `<Wordmark />` et ajouter l'import `import { Wordmark } from "@/components/Wordmark";`.

Dans `components/Footer.tsx`, remplacer le `<Link className="pa-mark" …>…</Link>` par `<Wordmark style={{ margin: 0 }} />` avec le même import.

Dans `app/page.tsx`, juste avant `<h1 className="pa-hero">`, insérer :

```tsx
            <span className="pa-meta" data-testid="surtitre-identite">
              {site.nom} <span className="pa-sep">·</span> {site.metier}
            </span>
```

Vérifier que `site` est importé dans `app/page.tsx` ; sinon ajouter `import { site } from "@/content/site";`.

Dans `styles/ajouts.css` :

```css
.pa-mark { display: inline-flex; align-items: baseline; }
.pa-mark-court { display: none; }
.pa-mark-long { white-space: nowrap; }
@media (max-width: 767px) {
  .pa-mark-court { display: inline; }
  .pa-mark-long { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
```

- [ ] **Step 5: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "nom complet|logo annonce"
```

Attendu : SUCCÈS sur `chromium` et `mobile` (sur mobile, le nom reste dans le nom accessible du lien).

- [ ] **Step 6: Commit**

```bash
git add components/Wordmark.tsx components/Navigation.tsx components/Footer.tsx app/page.tsx styles/ajouts.css tests/e2e/identite.spec.ts
git commit -m "feat(identite): nom complet en surtitre et dans le logo"
```

---

### Task 3 : Pied de page — remplacer l'indicateur faux

**Files:**
- Modify: `content/site.ts:21`, `components/Footer.tsx:40-44`
- Test: `tests/e2e/identite.spec.ts`

**Interfaces:**
- Consumes: `site.disponibilite`.
- Produces: `site.disponibiliteDetail: string` — phrase complète affichée dans le pied de page.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/identite.spec.ts` :

```ts
test("le pied de page annonce la disponibilité, pas un faux statut de service", async ({ page }) => {
  await page.goto("/");
  const pied = page.getByRole("contentinfo");
  await expect(pied).toContainText("Disponible pour un poste · Dakar ou à distance");
  await expect(pied).not.toContainText("services opérationnels");
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -g "faux statut de service"
```

Attendu : ÉCHEC (le texte actuel est « … · tous les services opérationnels »).

- [ ] **Step 3: Implémenter**

Dans `content/site.ts`, sous `disponibilite`, ajouter :

```ts
  disponibiliteDetail: "Disponible pour un poste · Dakar ou à distance",
```

Dans `components/Footer.tsx`, remplacer le contenu du premier `<span>` de `.pa-footer-bar` par :

```tsx
          <span>
            <span className="pa-dot" />
            {site.disponibiliteDetail}
          </span>
```

Retirer l'import `hoteAffiche` s'il n'est plus utilisé dans le fichier.

- [ ] **Step 4: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "faux statut de service"
```

Attendu : SUCCÈS.

- [ ] **Step 5: Commit**

```bash
git add content/site.ts components/Footer.tsx tests/e2e/identite.spec.ts
git commit -m "fix(pied de page): remplace le faux statut de service par la disponibilité"
```

---

### Task 4 : Bandeau de contact — GitHub, e-mail et bouton Copier

**Files:**
- Create: `components/CopyEmail.tsx`
- Modify: `components/CtaBand.tsx`, `styles/ajouts.css`
- Test: `tests/e2e/contact.spec.ts` (créer)

**Interfaces:**
- Consumes: `site.email`, `site.liens.github`, `site.liens.linkedin`.
- Produces: `<CopyEmail />` — composant client, sans props, affichant l'adresse et un bouton « Copier ».

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/e2e/contact.spec.ts` :

```ts
import { expect, test } from "@playwright/test";

test("le bandeau de contact donne l'e-mail, GitHub et un bouton Copier", async ({ page, context, browserName }) => {
  await page.goto("/#contact");
  const bandeau = page.locator("#contact");
  await expect(bandeau).toContainText("abdouazizsy@esp.sn");
  await expect(bandeau.getByRole("link", { name: /GitHub/ })).toBeVisible();

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await bandeau.getByRole("button", { name: /Copier/ }).click();
  await expect(bandeau.getByRole("button")).toContainText(/Copié|Copie impossible/);
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -g "bandeau de contact"
```

Attendu : ÉCHEC, ni l'adresse ni le bouton n'existent.

- [ ] **Step 3: Créer le composant CopyEmail**

`components/CopyEmail.tsx` :

```tsx
"use client";

import { useState } from "react";
import { site } from "@/content/site";

type Etat = "repos" | "copie" | "echec";

export function CopyEmail() {
  const [etat, setEtat] = useState<Etat>("repos");

  async function copier() {
    try {
      await navigator.clipboard.writeText(site.email);
      setEtat("copie");
    } catch {
      setEtat("echec");
    }
    setTimeout(() => setEtat("repos"), 2000);
  }

  const libelle = etat === "copie" ? "Copié" : etat === "echec" ? "Copie impossible" : "Copier";

  return (
    <span className="pa-copymail">
      <a href={`mailto:${site.email}`}>{site.email}</a>
      <button type="button" className="pa-menu" onClick={copier}>
        {libelle}
      </button>
      <span className="pa-sr" role="status" aria-live="polite">
        {etat === "copie" ? "Adresse copiée" : etat === "echec" ? "Copie impossible, sélectionnez l'adresse" : ""}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Brancher dans le bandeau**

Dans `components/CtaBand.tsx`, ajouter les imports :

```tsx
import { CopyEmail } from "@/components/CopyEmail";
import { TechIcon } from "@/components/TechIcon";
```

et, sous le `<h2 id="contact-titre">…</h2>`, insérer :

```tsx
          <p className="pa-cta-liens">
            <CopyEmail />
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

Dans `styles/ajouts.css` :

```css
.pa-cta-liens { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); margin-top: var(--space-4); }
.pa-copymail { display: inline-flex; align-items: center; gap: var(--space-2); }
```

- [ ] **Step 5: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "bandeau de contact"
```

Attendu : SUCCÈS. Si le presse-papiers est refusé par le navigateur en local, l'état « Copie impossible » satisfait aussi l'assertion.

- [ ] **Step 6: Commit**

```bash
git add components/CopyEmail.tsx components/CtaBand.tsx styles/ajouts.css tests/e2e/contact.spec.ts
git commit -m "feat(contact): e-mail copiable et liens de profil dans le bandeau"
```

---

### Task 5 : Nom du fichier CV au téléchargement

**Files:**
- Modify: `components/Button.tsx:14-35`, `components/Footer.tsx`, `components/TableOfContents.tsx:38-41`
- Test: `tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `Button` accepte désormais `download?: boolean | string` ; la chaîne devient la valeur de l'attribut `download`.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/contact.spec.ts` :

```ts
test("le CV se télécharge sous un nom explicite", async ({ page }) => {
  await page.goto("/");
  const liens = page.locator('a[href="/cv.pdf"]');
  const n = await liens.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(liens.nth(i)).toHaveAttribute("download", "CV_Abdou_Aziz_SY.pdf");
  }
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -g "nom explicite"
```

Attendu : ÉCHEC, l'attribut vaut la chaîne vide.

- [ ] **Step 3: Implémenter**

Dans `components/Button.tsx`, changer le type `download?: boolean;` en `download?: boolean | string;` et l'usage :

```tsx
      <a className={classes} href={href} download={typeof download === "string" ? download : download || undefined}>
```

Dans `content/site.ts`, ajouter à l'objet `site` :

```ts
  cv: { href: "/cv.pdf", fichier: "CV_Abdou_Aziz_SY.pdf" },
```

Remplacer les trois usages :
- `components/CtaBand.tsx` : `<Button href={site.cv.href} variant="secondary" download={site.cv.fichier} …>` ;
- `components/Footer.tsx` : `<a href={site.cv.href} download={site.cv.fichier}>Télécharger le CV</a>` ;
- `components/TableOfContents.tsx` : `<a className="pa-btn pa-btn--secondary pa-btn--sm" href={site.cv.href} download={site.cv.fichier}>` (ajouter l'import de `site` si absent).

Chercher d'éventuels autres usages : `grep -rn 'cv.pdf' app components`.

- [ ] **Step 4: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "nom explicite"
```

Attendu : SUCCÈS.

- [ ] **Step 5: Commit**

```bash
git add components content/site.ts tests/e2e/contact.spec.ts
git commit -m "fix(cv): nom de fichier explicite au téléchargement"
```

---

### Task 6 : En-tête mobile — icône de thème et bouton « Me contacter »

**Files:**
- Modify: `components/ThemeToggle.tsx`, `components/Navigation.tsx:21-30`, `styles/ajouts.css`
- Test: `tests/e2e/navigation-mobile.spec.ts` (créer)

**Interfaces:**
- Consumes: rien.
- Produces: `ThemeToggle` rend un `<button>` dont le nom accessible est « Papier / Nuit — thème clair » (bureau) ou « Thème clair » / « Thème sombre » (mobile).

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/e2e/navigation-mobile.spec.ts` :

```ts
import { expect, test } from "@playwright/test";

test.describe("en-tête mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("le bouton Me contacter est dans l'en-tête", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: /Me contacter|Contact/ })).toBeVisible();
  });

  test("le bouton de thème est une cible d'au moins 44 px et garde un nom clair", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByTestId("theme-toggle");
    const nom = await bouton.getAttribute("aria-label");
    expect(nom).toMatch(/Thème (clair|sombre)/);
    const boite = await bouton.boundingBox();
    expect(boite!.width).toBeGreaterThanOrEqual(44);
    expect(boite!.height).toBeGreaterThanOrEqual(44);
  });
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e --project=mobile -g "en-tête mobile"
```

Attendu : ÉCHEC (pas de bouton de contact, bouton de thème trop petit).

- [ ] **Step 3: Implémenter le bouton de thème**

Dans `components/ThemeToggle.tsx`, remplacer le `return` par :

```tsx
  const cible: Theme = theme === "dark" ? "light" : "dark";
  const nomCible = cible === "light" ? "Thème clair" : "Thème sombre";

  return (
    <button
      type="button"
      className="pa-menu pa-theme"
      onClick={basculer}
      aria-label={nomCible}
      title={nomCible}
      data-testid="theme-toggle"
    >
      <span className="pa-theme-texte" aria-hidden="true">
        {theme === "dark" ? "Papier" : "Nuit"}
      </span>
      <svg className="pa-theme-icone" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
```

Note : le nom accessible (`aria-label`) décrit la cible, et le texte visible « Papier / Nuit » est masqué aux technologies d'assistance par `aria-hidden`, ce qui évite la divergence relevée par Lighthouse.

- [ ] **Step 4: Adapter la navigation et les styles**

Dans `components/Navigation.tsx`, remplacer le bloc `.pa-nav-actions` par :

```tsx
        <div className="pa-nav-actions">
          <ThemeToggle />
          <Button href="#contact" size="sm" arrow>
            Me contacter
          </Button>
          <MobileMenu liens={liens} />
        </div>
```

Dans `styles/ajouts.css` :

```css
.pa-theme { display: inline-flex; align-items: center; justify-content: center; }
.pa-theme-icone { display: none; }
@media (max-width: 767px) {
  .pa-theme { min-width: 44px; min-height: 44px; padding: 0; }
  .pa-theme-texte { display: none; }
  .pa-theme-icone { display: block; }
  .pa-nav-actions { gap: var(--space-2); }
  .pa-nav-actions .pa-btn--sm { padding: 10px 12px; }
  .pa-nav-actions .pa-arr { display: none; }
}
```

- [ ] **Step 5: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e -g "en-tête mobile"
pnpm test:e2e -g "thème"
```

Attendu : SUCCÈS, y compris le test existant de bascule de thème (`tests/e2e/theme.spec.ts`). Vérifier ensuite qu'aucun débordement n'apparaît : `pnpm test:e2e -g "ne défilent pas horizontalement"`.

- [ ] **Step 6: Commit**

```bash
git add components/ThemeToggle.tsx components/Navigation.tsx styles/ajouts.css tests/e2e/navigation-mobile.spec.ts
git commit -m "feat(en-tête): icône de thème sur mobile et retour du bouton Me contacter"
```

---

### Task 7 : Carte de projet entièrement cliquable

**Files:**
- Modify: `components/ProjectCard.tsx:30-35`, `styles/ajouts.css`
- Test: `tests/e2e/projets.spec.ts`

**Interfaces:**
- Consumes: `Projet` (`lib/content`).
- Produces: la carte expose un seul lien ; sa zone cliquable couvre `article.pa-card`.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/projets.spec.ts` :

```ts
test("toute la carte ouvre le dossier", async ({ page }) => {
  await page.goto("/projets");
  const carte = page.getByTestId("project-card").first();
  expect(await carte.getByRole("link").count()).toBe(1);
  const boite = await carte.boundingBox();
  await page.mouse.click(boite!.x + boite!.width / 2, boite!.y + 20);
  await expect(page).toHaveURL(/\/projets\/[a-z0-9-]+$/);
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test:e2e -g "toute la carte"
```

Attendu : ÉCHEC, le clic au centre haut n'ouvre rien.

- [ ] **Step 3: Implémenter**

Dans `components/ProjectCard.tsx`, remplacer la balise `<article …>` par `<article className="pa-surface pa-card pa-card--lien" …>` et le lien du pied par :

```tsx
        <Link className="pa-link pa-card-cible" href={`/projets/${projet.slug}`}>
          Ouvrir le dossier<span className="pa-sr"> {projet.titre}</span> →
        </Link>
```

Dans `styles/ajouts.css` :

```css
/* Lien étendu : toute la carte est cliquable, sans ajouter de second lien. */
.pa-card--lien { position: relative; }
.pa-card-cible::after { content: ""; position: absolute; inset: 0; }
.pa-card--lien:focus-within { border-color: var(--accent); transform: translateY(-3px); }
.pa-card--lien :is(h3, p, .pa-meta) { position: relative; z-index: 1; pointer-events: none; }
```

- [ ] **Step 4: Relancer le test et vérifier qu'il passe**

```bash
pnpm test:e2e -g "toute la carte"
pnpm test:e2e -g "filtres"
```

Attendu : SUCCÈS, et le test de filtres existant reste vert.

- [ ] **Step 5: Commit**

```bash
git add components/ProjectCard.tsx styles/ajouts.css tests/e2e/projets.spec.ts
git commit -m "feat(projets): carte entièrement cliquable"
```

---

### Task 8 : Menu mobile — Échap, clic extérieur, retour du focus

**Files:**
- Modify: `components/MobileMenu.tsx`
- Test: `tests/e2e/navigation-mobile.spec.ts`

**Interfaces:**
- Consumes: `LienNav` (`components/NavLinks`).
- Produces: rien de nouveau.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/navigation-mobile.spec.ts`, dans le `describe` existant :

```ts
  test("Échap ferme le menu et rend le focus au bouton", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    await expect(bouton).toBeFocused();
  });

  test("un clic hors du panneau ferme le menu", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await page.locator("main").click({ position: { x: 10, y: 300 } });
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
  });
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

```bash
pnpm test:e2e --project=mobile -g "Échap ferme|clic hors"
```

Attendu : ÉCHEC (focus perdu, panneau toujours ouvert après clic extérieur).

- [ ] **Step 3: Implémenter**

Dans `components/MobileMenu.tsx`, remplacer le corps du composant par :

```tsx
export function MobileMenu({ liens }: { liens: LienNav[] }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  const boutonRef = useRef<HTMLButtonElement>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);

  const fermerEtRendreFocus = useCallback(() => {
    setOuvert(false);
    boutonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermerEtRendreFocus();
    };
    const surClic = (e: PointerEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    window.addEventListener("keydown", surTouche);
    document.addEventListener("pointerdown", surClic);
    return () => {
      window.removeEventListener("keydown", surTouche);
      document.removeEventListener("pointerdown", surClic);
    };
  }, [ouvert, fermerEtRendreFocus]);

  const fermer = () => setOuvert(false);

  return (
    <div className="pa-mobile-only" ref={conteneurRef}>
      <button
        type="button"
        ref={boutonRef}
        className="pa-menu"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert((v) => !v)}
      >
        Menu
      </button>
      <div id={id} className="pa-menu-panel" hidden={!ouvert}>
        <nav aria-label="Principale (mobile)">
          <NavLinks liens={liens} onNavigate={fermer} />
          <a href="#contact" onClick={fermer}>
            Me contacter
          </a>
        </nav>
      </div>
    </div>
  );
}
```

Mettre à jour l'import React : `import { useCallback, useEffect, useId, useRef, useState } from "react";`.

- [ ] **Step 4: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e --project=mobile -g "Échap ferme|clic hors|menu"
```

Attendu : SUCCÈS, y compris les tests de menu existants.

- [ ] **Step 5: Commit**

```bash
git add components/MobileMenu.tsx tests/e2e/navigation-mobile.spec.ts
git commit -m "fix(menu mobile): fermeture au clic extérieur et retour du focus après Échap"
```

---

### Task 9 : Garde-fou sur l'URL de production

**Files:**
- Modify: `lib/site-url.ts`
- Test: `tests/site-url.test.ts` (créer)

**Interfaces:**
- Consumes: variables d'environnement `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_ENV`.
- Produces: `siteUrl()` lève une `Error` en production sans URL.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/site-url.test.ts` :

```ts
import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site-url";

const sauvegarde = { ...process.env };

afterEach(() => {
  process.env = { ...sauvegarde };
});

describe("siteUrl", () => {
  it("préfère la variable explicite et retire la barre finale", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://exemple.sn/";
    expect(siteUrl()).toBe("https://exemple.sn");
  });

  it("utilise l'URL de production Vercel", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "portfolio.vercel.app";
    expect(siteUrl()).toBe("https://portfolio.vercel.app");
  });

  it("échoue en production quand aucune URL n'est définie", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_ENV = "production";
    expect(() => siteUrl()).toThrow(/URL/i);
  });

  it("retombe sur localhost hors production", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_ENV;
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

```bash
pnpm test -- site-url
```

Attendu : ÉCHEC sur le troisième cas (aucune erreur levée).

- [ ] **Step 3: Implémenter**

Dans `lib/site-url.ts` :

```ts
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "URL du site absente en production : définir NEXT_PUBLIC_SITE_URL ou VERCEL_PROJECT_PRODUCTION_URL.",
    );
  }
  return "http://localhost:3000";
}
```

- [ ] **Step 4: Relancer le test et vérifier qu'il passe**

```bash
pnpm test -- site-url
```

Attendu : 4 tests SUCCÈS.

- [ ] **Step 5: Commit**

```bash
git add lib/site-url.ts tests/site-url.test.ts
git commit -m "fix(seo): interdit un build de production sans URL de site"
```

---

### Task 10 : Titre de la page 404 et titre de la page Projets

**Files:**
- Modify: `app/not-found.tsx`, `app/projets/page.tsx:21-28`
- Test: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces: rien.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `tests/e2e/navigation.spec.ts` :

```ts
test("la page 404 a un titre explicite", async ({ page }) => {
  await page.goto("/page-qui-nexiste-pas");
  await expect(page).toHaveTitle(/Page introuvable/);
});

test("la grille de projets est annoncée par un titre de section", async ({ page }) => {
  await page.goto("/projets");
  await expect(page.getByRole("heading", { level: 2, name: /dossiers/i })).toBeAttached();
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

```bash
pnpm test:e2e -g "404 a un titre|titre de section"
```

Attendu : ÉCHEC pour les deux.

- [ ] **Step 3: Implémenter**

Dans `app/not-found.tsx`, ajouter en haut :

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page introuvable" };
```

Dans `app/projets/page.tsx`, au-dessus de la grille (section qui contient `<ProjectGrid …>`), insérer :

```tsx
        <h2 className="pa-sr">Tous les dossiers</h2>
```

- [ ] **Step 4: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e -g "404 a un titre|titre de section"
```

Attendu : SUCCÈS.

- [ ] **Step 5: Commit**

```bash
git add app/not-found.tsx app/projets/page.tsx tests/e2e/navigation.spec.ts
git commit -m "fix(a11y): titre de la page 404 et titre de section sur la grille de projets"
```

---

### Task 11 : Correctifs de contraste, de statuts et de libellés

**Files:**
- Modify: `styles/ajouts.css`, `app/projets/[slug]/page.tsx` (ligne du statut « Terminé »), `components/DecisionRecord.tsx:28-33`, `components/Frame.tsx:22`
- Test: `tests/e2e/a11y.spec.ts` (créer)

**Interfaces:**
- Consumes: `statutLabel`, `Statut` (`lib/schemas`).
- Produces: classe CSS `.pa-st-done` pour un statut neutre, `.pa-dot.is-accepte` pour une décision acceptée.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `tests/e2e/a11y.spec.ts` :

```ts
import { expect, test } from "@playwright/test";

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: number[], b: number[]) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test("les séparateurs de métadonnées atteignent 4,5:1", async ({ page }) => {
  await page.goto("/projets");
  const couleurs = await page.locator(".pa-meta .pa-sep").first().evaluate((el) => {
    const style = getComputedStyle(el);
    const fond = getComputedStyle(document.body).backgroundColor;
    return { texte: style.color, fond };
  });
  const lire = (s: string) => s.match(/\d+/g)!.slice(0, 3).map(Number);
  expect(contraste(lire(couleurs.texte), lire(couleurs.fond))).toBeGreaterThanOrEqual(4.5);
});

test("le cartouche d'initiales est nommé correctement", async ({ page }) => {
  await page.goto("/a-propos");
  const initiales = page.getByRole("img", { name: /Initiales d'Abdou Aziz Sy/ });
  expect(await initiales.count()).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

```bash
pnpm test:e2e -g "séparateurs|cartouche d'initiales"
```

Attendu : ÉCHEC (contraste 3,45:1 ; libellé « Initiales de Abdou Aziz Sy »).

- [ ] **Step 3: Implémenter**

Dans `styles/ajouts.css` :

```css
.pa-meta .pa-sep { color: var(--ink-faint); }
.pa-meta > span { white-space: nowrap; }
.pa-st-done { color: var(--ink-muted); }
.pa-dot.is-accepte { background: var(--ok); border-radius: 0; }
```

Dans `components/Frame.tsx`, remplacer `aria-label={`Initiales de ${site.nom}`}` par :

```tsx
        <div className="pa-ph pa-frame-media" role="img" aria-label={`Initiales d'${site.nom}`}>
```

Dans `app/projets/[slug]/page.tsx`, trouver le rendu du statut « Terminé » (`grep -n "Terminé\|statutLabel" app/projets/\[slug\]/page.tsx`) et ajouter la classe `pa-st-done` au conteneur du libellé, à la place d'une classe de lien ou d'accent.

Dans `components/DecisionRecord.tsx`, remplacer le bloc de statut par :

```tsx
        <span className="pa-meta">
          <span className={statut === "Acceptée" ? "pa-st-ok" : "pa-st-open"}>
            <span className={statut === "Acceptée" ? "pa-dot is-accepte" : "pa-dot is-open"} />
            {statut}
          </span>
        </span>
```

- [ ] **Step 4: Relancer les tests et vérifier qu'ils passent**

```bash
pnpm test:e2e -g "séparateurs|cartouche d'initiales"
```

Attendu : SUCCÈS. Vérifier visuellement que « Terminé » n'a plus la couleur des liens : `node .work/el.mjs http://localhost:3001/projets/hackathon-mcn ".pa-metaband" .work/statut.png 1280 dark`.

- [ ] **Step 5: Commit**

```bash
git add styles/ajouts.css components/Frame.tsx components/DecisionRecord.tsx "app/projets/[slug]/page.tsx" tests/e2e/a11y.spec.ts
git commit -m "fix(a11y): contraste des séparateurs, statuts distincts et libellé des initiales"
```

---

### Task 12 : Vérification complète et mesure

**Files:**
- Modify: aucun (sauf correctifs découverts)
- Test: toute la suite

**Interfaces:**
- Consumes: tout ce qui précède.
- Produces: rapport de vérification dans le message final.

- [ ] **Step 1: Arrêter tout serveur local**

```bash
MSYS_NO_PATHCONV=1 netstat -ano | grep -E ':(3001|3100) ' || echo "aucun serveur"
```

Tuer le processus trouvé avec `powershell -c "Stop-Process -Id <pid>"`.

- [ ] **Step 2: Lancer la chaîne complète**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

Attendu : lint et types sans erreur ; tests unitaires tous verts (26 existants + 4 nouveaux) ; build réussi ; e2e tous verts.

- [ ] **Step 3: Mesurer l'accessibilité**

```bash
bash .work/serve.sh
bash .work/lh.sh / 1
```

Attendu : accessibilité 100, bonnes pratiques 100, SEO 100, CLS 0. Arrêter ensuite le serveur.

- [ ] **Step 4: Revue visuelle**

```bash
node .work/slices.mjs http://localhost:3001/ audit-1 375 dark 900
node .work/slices.mjs http://localhost:3001/ audit-2 1280 light 900
```

Regarder les images produites : nom visible, en-tête mobile complet, pied de page correct, aucune coupure.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: vérification du chantier 1"
```

---

## Self-Review

- **Couverture de la spec** : A.1 → tâche 1 ; A.2 → tâche 1 ; B.3 → tâche 2 ; B.4 → tâche 3 ; B.5 → tâche 4 ; B.6 → tâche 12 (le titre conditionnel existe déjà dans `app/page.tsx`, à vérifier lors de la revue) ; B.7 → tâche 5 ; B.8 → tâche 10 ; B.9 → tâches 10 et 11 ; C.10 → tâche 6 ; C.11 → tâche 7 ; C.12 → tâche 8 ; C.13 → tâche 9 ; tests → chaque tâche + tâche 12.
- **Placeholders** : aucun « TBD » ; chaque étape porte le code à écrire.
- **Cohérence des types** : `download?: boolean | string` (tâche 5) est utilisé par `CtaBand`, `Footer`, `TableOfContents` ; `site.cv` est introduit en tâche 5 et consommé par ces trois fichiers ; `Wordmark` (tâche 2) est consommé par `Navigation` et `Footer`.
