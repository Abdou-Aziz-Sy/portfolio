# Portfolio — plan de construction

> **Statut au 19/09/2026 : exécuté et fusionné dans `main`** (fusion 5955fce). Les cases ci-dessous n'ont pas été tenues à jour pendant l'exécution ; l'état réel est dans l'historique Git et dans `docs/superpowers/HANDOFF-2026-09-19.md`.

> **Pour les agents :** SOUS-SKILL REQUIS : superpowers:executing-plans (exécution en ligne, choisie par l'utilisateur). Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** construire et déployer le portfolio décrit dans `docs/superpowers/specs/2026-09-17-portfolio-design.md`.

**Architecture :** Next.js 16 en App Router, entièrement statique. Le contenu vit dans des fichiers MDX validés par Zod. Le style reprend tel quel le `bundle.css` du système de design « Plan d'architecte » (classes `pa-`), rendu responsive, avec des variables générées depuis `tokens.json`. Chaque élément du système de design devient un composant React.

**Pile :** Next.js 16.3, React 19, TypeScript strict, next-mdx-remote 6, gray-matter, Zod, Vitest, Playwright, pnpm 10, Vercel.

## Contraintes globales

- Tout le texte visible est en français, à la première personne. Pas d'emoji, pas de point d'exclamation, pas de niveau de compétence.
- **Aucun chiffre inventé.** Seuls ces quatre faits s'affichent en chiffres : 8 processus, 13 domaines d'API testés, 2 sites, 260 km.
- **Aucun contenu fictif en ligne** :
  - les recommandations, le blog, les captures, le portrait et les liens sans URL sont masqués tant qu'ils manquent ;
  - un contenu avec `publie: false` n'est ni affiché ni généré.
- Corrections de la maquette, obligatoires (spec, section 7) :
  - pas de `worker-ia` : c'est `ollama · llm`, et l'OCR est dans `backend` ;
  - Nginx tourne sur l'hôte, hors de la zone Docker ;
  - la CI construit, déploie par SSH puis vérifie que le site répond, sans lancer la suite de tests ;
  - l'e-mail est `abdouazizsy@esp.sn`.
- Les orientations backend, conception de systèmes et infrastructure s'affichent comme des domaines, jamais comme des titres (« architecte », « DevOps »).
- Contraste d'au moins 4,5:1 dans les deux thèmes, focus visible, animations coupées sous `prefers-reduced-motion`.
- Les planches `docs/design/components/Planche-*/preview.html` sont la référence de balisage : chaque composant reproduit leur structure et leurs classes `pa-`.

## Arborescence cible

```
app/layout.tsx · app/page.tsx · app/projets/page.tsx · app/projets/[slug]/page.tsx
app/blog/page.tsx · app/blog/[slug]/page.tsx · app/a-propos/page.tsx · app/not-found.tsx
app/sitemap.ts · app/robots.ts · app/opengraph-image.tsx · app/globals.css
components/*.tsx            composants du système de design
components/diagrams/*.tsx   schémas SVG (UgbLinkDiagram, MiniDiagram)
components/mdx.tsx          table des composants MDX
content/site.ts             données du site
content/projets/*.mdx · content/blog/*.mdx
lib/schemas.ts · lib/content.ts · lib/reading-time.ts · lib/filters.ts · lib/site-url.ts
styles/tokens.css (généré) · styles/plan.css (porté)
scripts/build-tokens.mjs · scripts/port-css.mjs · scripts/extract-icons.mjs
tests/unit/*.test.ts · tests/e2e/*.spec.ts
public/cv.pdf · public/icons.svg
.github/workflows/ci.yml
```

---

### Tâche 1 : squelette du projet

**Fichiers :** `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.gitattributes`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `app/layout.tsx`, `app/page.tsx`

**Interfaces produites :** scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `tokens`, `port-css`, `icons`.

- [ ] Créer le projet avec `pnpm create next-app@16.3.5 . --ts --eslint --app --no-tailwind --no-src-dir --import-alias "@/*" --use-pnpm`, depuis un dossier temporaire, puis déplacer les fichiers à la racine sans écraser `docs/`.
- [ ] Installer : `pnpm add next-mdx-remote@6 gray-matter zod` et `pnpm add -D vitest @vitest/coverage-v8 @playwright/test tsx`.
- [ ] `.gitattributes` : `* text=auto eol=lf`. `.gitignore` : ajouter `.work/`, `test-results/`, `playwright-report/`, `.vercel`.
- [ ] Scripts `package.json` :
  - `"typecheck": "tsc --noEmit"`
  - `"test": "vitest run"`
  - `"test:e2e": "playwright test"`
  - `"tokens": "node scripts/build-tokens.mjs"`
  - `"port-css": "node scripts/port-css.mjs"`
  - `"icons": "node scripts/extract-icons.mjs"`
- [ ] `vitest.config.ts` : environnement `node`, `include: ["tests/unit/**/*.test.ts"]`, alias `@` vers la racine.
- [ ] `playwright.config.ts` :
  - `webServer` : `pnpm build && pnpm start -p 3100`, avec `url: http://localhost:3100` ;
  - projets `chromium` (bureau) et `mobile` (Pixel 7) ;
  - `testDir: tests/e2e`.
- [ ] Vérifier : `pnpm build` passe, `pnpm lint` passe.
- [ ] Commit : `chore: squelette Next.js 16 + outillage de tests`.

### Tâche 2 : jetons de design et feuille de style

**Fichiers :** `scripts/build-tokens.mjs`, `styles/tokens.css`, `scripts/port-css.mjs`, `styles/plan.css`, `app/globals.css`, `tests/unit/tokens.test.ts`

**Interfaces produites :**
- variables CSS de chaque jeton couleur, espacement, rayon et mise en page, sous `:root, [data-theme="dark"]` et `[data-theme="light"]` ;
- variables `--font-sans`, `--font-accent` et `--font-mono`, fournies par `next/font` (tâche 4).

- [ ] **Test d'abord** (`tests/unit/tokens.test.ts`) : importer `renderTokens` de `scripts/build-tokens.mjs` et vérifier que la sortie pour `docs/design/tokens.json` contient :
  - `--ground: #020a13;` dans le bloc sombre, et `--ground: #f3f5f7;` dans le bloc clair ;
  - `--space-5: 24px;` et `--page-max: 1200px;`.
- [ ] Lancer `pnpm test` : échec attendu (module absent).
- [ ] Écrire `scripts/build-tokens.mjs`. Il exporte `renderTokens(json)` et écrit `styles/tokens.css` quand il est lancé directement.
  - Couleurs : pour chaque thème, une ligne `--<nom>: <valeur>;` par jeton. Le thème `dark` s'applique à `:root, [data-theme="dark"]`, le thème `light` à `[data-theme="light"]`.
  - Familles `spacing`, `radius`, `layout` : une ligne par jeton dans `:root`.
- [ ] Relancer `pnpm test` : succès. Lancer `pnpm tokens`.
- [ ] Écrire `scripts/port-css.mjs`, qui lit `docs/design/components/bundle.css` et produit `styles/plan.css` :
  1. retirer la ligne `@import url("https://fonts.googleapis.com/...")` (les polices viennent de `next/font`) ;
  2. extraire chaque règle dont le sélecteur commence par `.pa-m ` et la réécrire sans ce préfixe, dans un bloc `@media (max-width: 767px) { … }` ajouté en fin de fichier ;
  3. ajouter en fin de fichier un bloc tablette `@media (max-width: 1023px)` :
     - `.pa-grid { grid-template-columns: 1fr 1fr }` ;
     - `.pa-feature { grid-template-columns: 1fr }` ;
     - `.pa-domains { grid-template-columns: 1fr }`, et `.pa-domain + .pa-domain` avec une bordure haute à la place de la bordure gauche ;
     - `.pa-casegrid { grid-template-columns: 1fr }` et `.pa-toc { position: static }` ;
     - `.pa-metaband { grid-template-columns: 1fr 1fr }`.
- [ ] Lancer `pnpm port-css`. Vérifier que `grep -c "\.pa-m " styles/plan.css` renvoie 0 et que le bloc `@media (max-width: 767px)` existe.
- [ ] `app/globals.css` :
  - `@import "../styles/tokens.css"; @import "../styles/plan.css";` ;
  - `html { background: var(--ground); color-scheme: dark }` et `html[data-theme="light"] { color-scheme: light }` ;
  - `body { margin: 0 }`.
- [ ] Commit : `feat(style): jetons des deux thèmes et portage responsive du système de design`.

### Tâche 3 : icônes des technologies

**Fichiers :** `scripts/extract-icons.mjs`, `public/icons.svg`, `components/TechIcon.tsx`, `lib/icons.ts`

**Interfaces produites :**
- `type IconKey = "nodedotjs" | "express" | "typescript" | "javascript" | "postgresql" | "redis" | "docker" | "githubactions" | "github" | "nginx" | "linux" | "react" | "nextdotjs" | "minio" | "ollama" | "trpc"` ;
- `iconLabel: Record<IconKey, string>` ;
- `<TechIcon name={IconKey} size?={number} />`, qui rend `<svg class="pa-logo"><use href="/icons.svg#si-<name>"/></svg>`.

- [ ] `scripts/extract-icons.mjs` : parcourir les sept `preview.html`, collecter chaque `<symbol id="si-…">…</symbol>` unique, puis écrire `public/icons.svg` (`<svg xmlns="http://www.w3.org/2000/svg">` suivi des symboles). Lancer `pnpm icons` et vérifier le nombre de symboles.
- [ ] Si des clés de `IconKey` manquent dans les planches (`javascript` par exemple), les retirer du type : n'exposer que les clés présentes.
- [ ] `lib/icons.ts` : `iconKeys` (`as const`), `IconKey` et `iconLabel`. Par exemple : `nodedotjs` → « Node.js », `githubactions` → « GitHub Actions », `nextdotjs` → « Next.js », `ollama` → « Ollama ».
- [ ] `components/TechIcon.tsx` : `aria-hidden="true"`, `width` et `height` à `size ?? 14`, classe `pa-logo`.
- [ ] Commit : `feat(icones): sprite des logos Simple Icons extrait de la maquette`.

### Tâche 4 : couche de contenu

**Fichiers :** `lib/schemas.ts`, `lib/reading-time.ts`, `lib/filters.ts`, `lib/content.ts`, `content/site.ts`, `tests/unit/content.test.ts`, `tests/unit/filters.test.ts`, `tests/unit/reading-time.test.ts`, `tests/fixtures/content/**`

**Interfaces produites :**

```ts
// lib/schemas.ts
export const categories = ["backend", "full-stack", "infrastructure", "ia"] as const;
export type Categorie = (typeof categories)[number];
export const categorieLabel: Record<Categorie, string> = {
  backend: "Backend", "full-stack": "Full stack", infrastructure: "Infrastructure", ia: "IA appliquée",
};
export const statutLabel = { "en-production": "En production", "en-cours": "En cours", termine: "Terminé" } as const;
export type Statut = keyof typeof statutLabel;
export const ligneStatutSchema = z.object({ service: z.string(), detail: z.string(), etat: z.enum(["en production", "opérationnel"]) });
export const miniSchemaSchema = z.tuple([boite, boite, boite]); // boite = z.object({ titre: z.string(), sous: z.string() })
export const projetSchema = z.object({
  titre: z.string().min(1), accroche: z.string().min(1), resume: z.string().min(1),
  dossier: z.number().int().positive(), annee: z.number().int(),
  statut: z.enum(["en-production", "en-cours", "termine"]), cadre: z.string().min(1),
  categories: z.array(z.enum(categories)).min(1), stack: z.array(z.enum(iconKeys)),
  stackLibelles: z.array(z.string()).optional(),   // étiquettes sans logo
  libelles: z.record(z.string(), z.string()).optional(), // surcharge du libellé d'une icône (ollama → « IA auto-hébergée »)
  role: z.string().optional(), periode: z.string().optional(), stackDetail: z.string().optional(),
  misEnAvant: z.boolean().default(false),
  lignesStatut: z.array(ligneStatutSchema).optional(),
  miniSchema: miniSchemaSchema, schema: z.enum(["ugb-link"]).optional(),
  depot: z.string().url().optional(), demo: z.string().url().optional(),
  publie: z.boolean(),
});
export const articleSchema = z.object({
  titre: z.string().min(1), chapo: z.string().min(1), date: z.coerce.date(),
  etiquettes: z.array(z.string()), projetLie: z.string().optional(), publie: z.boolean(),
});
export type ProjetMeta = z.infer<typeof projetSchema>;
export type ArticleMeta = z.infer<typeof articleSchema>;

// lib/content.ts
export type Projet = ProjetMeta & { slug: string; corps: string; sections: Section[] };
export type Article = ArticleMeta & { slug: string; corps: string; minutes: number };
export type Section = { id: string; numero: string; titre: string };
export function getProjets(dir?: string): Projet[]         // publiés, triés par dossier croissant
export function getProjet(slug: string, dir?: string): Projet | undefined
export function getArticles(dir?: string): Article[]       // publiés, triés par date décroissante
export function getArticle(slug: string, dir?: string): Article | undefined
export function extraireSections(corps: string): Section[] // à partir des titres « ## »

// lib/reading-time.ts
export function tempsDeLecture(texte: string): number      // mots / 220, arrondi au supérieur, minimum 1

// lib/filters.ts
export function filtrerProjets<T extends { categories: readonly string[] }>(projets: T[], categorie: string | null): T[]
export function lireCategorie(valeur: string | null | undefined): Categorie | null
```

`content/site.ts` exporte `site` :

```ts
export const site = {
  nom: "Abdou Aziz Sy", initiales: "AAS", metier: "Ingénieur logiciel",
  ville: "Dakar, Sénégal", villeCourte: "DAKAR, SN",
  email: "abdouazizsy@esp.sn",
  liens: { linkedin: undefined as string | undefined, github: "https://github.com/Abdou-Aziz-Sy" },
  diplome: "Diplômé ESP 2026", disponibilite: "Disponible pour un poste",
  portrait: undefined as string | undefined,            // "/portrait.jpg" quand le fichier existe
  faits: [
    { valeur: "8", libelle: "processus administratifs en production" },
    { valeur: "13", libelle: "domaines d'API couverts par des tests bout en bout" },
    { valeur: "2", libelle: "sites reliés" },
    { valeur: "260", unite: "km", libelle: "entre Dakar et Saint-Louis" },
  ],
  domaines: [ /* 3 entrées : cle ("backend" | "systemes" | "infra"), titre, phrase, fais: string[],
                 outils: { libelle: string; icone?: IconKey }[] — contenus exacts de la planche 1 */ ],
  parcours: [ /* 4 entrées : periode, titre, detail?, actuel? — planche 6 */ ],
  stack: [ /* 8 entrées : icone, nom, role — planche 6 */ ],
  recommandations: [] as { citation: string; nom: string; fonction: string; photo?: string }[],
};
```

- [ ] **Tests d'abord.**
  - `reading-time.test.ts` : 220 mots donnent 1, 221 mots donnent 2, une chaîne vide donne 1.
  - `filters.test.ts` :
    - `null` renvoie tout ;
    - `"backend"` ne garde que les projets qui ont cette catégorie ;
    - une valeur inconnue passée à `lireCategorie` renvoie `null`.
  - `content.test.ts`, avec des fixtures dans `tests/fixtures/content/{projets,blog}` (un projet publié, un non publié, un invalide dans un sous-dossier `invalide/`, deux articles publiés à des dates différentes, un article non publié) :
    - `getProjets` exclut le projet non publié et trie par dossier ;
    - `getArticles` trie par date décroissante et exclut les non publiés ;
    - un frontmatter invalide lève une erreur qui cite le nom du fichier ;
    - `extraireSections("## Contexte\n…\n## Contraintes")` renvoie des numéros « 01 », « 02 » et des id `contexte`, `contraintes`. Les id sont des slugs sans accents : « Ce que je referais autrement » donne `ce-que-je-referais-autrement`.
- [ ] Lancer `pnpm test` : échecs attendus.
- [ ] Implémenter, avec :
  - `gray-matter` pour lire les fichiers et `projetSchema.parse` / `articleSchema.parse`, en réemballant l'erreur : `Contenu invalide dans <fichier> : <message>` ;
  - `dir` par défaut à `path.join(process.cwd(), "content", "projets" | "blog")` ;
  - un slug égal au nom de fichier sans `.mdx`.
- [ ] Lancer `pnpm test` : tout passe. Lancer aussi `pnpm typecheck`.
- [ ] Commit : `feat(contenu): schémas Zod, lecture MDX, filtres et temps de lecture`.

### Tâche 5 : gabarit commun (navigation, thème, contact, pied de page)

**Fichiers :** `app/layout.tsx`, `components/Navigation.tsx`, `components/MobileMenu.tsx`, `components/ThemeToggle.tsx`, `components/ThemeScript.tsx`, `components/CtaBand.tsx`, `components/Footer.tsx`, `components/Button.tsx`, `lib/site-url.ts`

**Interfaces :**
- consomme `site` et `getArticles` ;
- produit :
  - `<Button href variant="primary"|"secondary" size?="sm" arrow?>` ;
  - `<Navigation current?: "projets"|"blog"|"a-propos" />` ;
  - `siteUrl()`, qui renvoie `process.env.NEXT_PUBLIC_SITE_URL` ou `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`, ou `http://localhost:3000` par défaut ;
  - `hoteAffiche()`, qui renvoie l'hôte de `siteUrl()` sans protocole.

- [ ] `app/layout.tsx` :
  - `next/font/google` pour `Schibsted_Grotesk` (400 à 800), `DM_Serif_Display` (400, normal et italique) et `JetBrains_Mono` (400, 500), déclarés avec `variable: "--font-sans"`, `"--font-accent"` et `"--font-mono"` ;
  - `<html lang="fr" data-theme="dark" suppressHydrationWarning>` ;
  - `<ThemeScript/>` dans `<head>` ;
  - `<body className="pa pa-ground">` qui contient `<Navigation/>`, `{children}`, `<CtaBand/>` et `<Footer/>` ;
  - métadonnées : `metadataBase: new URL(siteUrl())`, titre par défaut « Abdou Aziz Sy — Ingénieur logiciel », gabarit `%s — Abdou Aziz Sy`, description « Ingénieur logiciel à Dakar, orienté backend, conception de systèmes et infrastructure. ».
- [ ] `ThemeScript` : script en ligne qui lit `localStorage.getItem("theme")` et, si la valeur est `light` ou `dark`, l'applique à `document.documentElement.dataset.theme`, le tout dans un `try/catch`.
- [ ] `ThemeToggle` (client) :
  - bouton `pa-menu` libellé « Papier » en thème sombre, « Nuit » en thème clair ;
  - `aria-label="Passer au thème clair"` ou `"Passer au thème sombre"` ;
  - au clic : bascule `data-theme` et écrit `localStorage` dans un `try/catch`.
- [ ] `Navigation` reproduit le `header.pa-nav` des planches :
  - marque « AAS. » avec `aria-label` ;
  - liens Projets, Blog (**seulement si `getArticles().length > 0`**) et À propos, avec `aria-current="page"` sur le lien actif ;
  - `ThemeToggle`, et le bouton « Me contacter → » vers `#contact`.
  - En dessous de 768 px, les liens passent dans `MobileMenu` (client) : un bouton `pa-menu` « Menu » avec `aria-expanded` et `aria-controls`, qui ouvre un panneau `pa-surface` contenant les mêmes liens. Le panneau se ferme par Échap et au clic sur un lien. Les styles du panneau s'ajoutent à la fin de `styles/plan.css`, dans une section « Ajouts » que `port-css` conserve (marqueur `/* AJOUTS */`).
- [ ] `CtaBand` : `section#contact.pa-cta`, texte exact des planches :
  - « Me contacter → » en `mailto:abdouazizsy@esp.sn` ;
  - « Télécharger le CV PDF » vers `/cv.pdf`, avec l'attribut `download`.
- [ ] `Footer` :
  - liens : e-mail, LinkedIn (seulement si l'URL existe), GitHub avec son icône, CV ;
  - barre : `<span class="pa-dot"/>` suivi de `{hoteAffiche()} · tous les services opérationnels`, puis « Dakar, SN · © 2026 ».
- [ ] Copier `C:\Users\syabd\Documents\Docs pro\cv\CV_Abdou_Aziz_SY.pdf` vers `public/cv.pdf`.
- [ ] Vérifier : `pnpm build`, puis `pnpm start` et `curl -s localhost:3000 | grep -c "Me contacter"` (au moins 2).
- [ ] Commit : `feat(gabarit): navigation, bascule de thème, bandeau de contact et pied de page`.

### Tâche 6 : composants de l'accueil et page d'accueil

**Fichiers :** `components/Frame.tsx`, `components/IntroBand.tsx`, `components/DomainColumn.tsx`, `components/DomainPictogram.tsx`, `components/FactStrip.tsx`, `components/StatusLine.tsx`, `components/StatusMeta.tsx`, `components/Tag.tsx`, `components/ProjectCard.tsx`, `components/diagrams/MiniDiagram.tsx`, `components/diagrams/UgbLinkDiagram.tsx`, `components/FeaturedCase.tsx`, `components/Testimonial.tsx`, `components/ArticleList.tsx`, `components/SectionHead.tsx`, `app/page.tsx`

**Interfaces produites :**
- `<StatusMeta statut={Statut} />` : la pastille et le libellé (`pa-st-ok` et `pa-dot` pour « En production », `pa-st-open` et `pa-dot is-open` pour « En cours », `pa-dot is-done` pour « Terminé ») ;
- `<ProjectCard projet={Projet} />` : l'`article.pa-surface.pa-card` de la planche 1, lignes 362 à 408, avec `data-cats` ;
- `<MiniDiagram boites={[b1, b2, b3]} label={string} />` : le SVG 320×64 de la planche 1, lignes 372 à 392, la boîte du milieu en `d-box-acc` ;
- `<UgbLinkDiagram />` : le SVG 980×482 de la planche 1, lignes 245 à 347, corrigé (voir plus bas) ;
- `<SectionHead meta titre lien? />` : le bloc `pa-sechead`.

- [ ] `Frame` :
  - si `site.portrait` existe, `next/image`, sinon un `div.pa-ph` qui affiche les initiales ;
  - légende `figcaption.pa-frame-block.pa-meta` : « A. A. SY — DAKAR, SN » et « FEUILLE 0n ».
- [ ] `DomainColumn` :
  - variante `complete` (planche 1, lignes 67 à 98 : titre, phrase, « Ce que je fais », « Outils » avec les icônes) ;
  - variante `breve` (planche 6, lignes 100 à 119 : titre, phrase, `p.pa-inline-logos`) ;
  - pictogrammes : les trois SVG de la planche 1 (lignes 68 à 74, 100 à 105 et 130 à 137) dans `DomainPictogram`, avec la clé `backend | systemes | infra`.
- [ ] `UgbLinkDiagram` : recopier le SVG en JSX, avec `className` à la place de `class` et `<use href="/icons.svg#si-…"/>`, et appliquer ces corrections :
  - zone extérieure `x=196 y=20 width=620 height=432`, étiquette « VM — HÔTE » ;
  - nouvelle zone intérieure `rect.d-zone x=396 y=44 width=412 height=380`, étiquette « DOCKER COMPOSE » en `x=428 y=62`, avec le logo Docker en `x=404 y=49`. La boîte Nginx reste **hors** de cette zone, et les boîtes Front, API, PostgreSQL, Redis, MinIO, Ollama et Sauvegarde restent dedans. Décaler le texte « VM — HÔTE » en `x=208` et supprimer l'ancien logo Docker de la zone extérieure ;
  - la boîte d'IA affiche « Ollama », sous-titre « LLM » ;
  - l'API affiche le sous-titre « Node.js · OCR » ;
  - GitHub Actions affiche le sous-titre « build · déploiement » ;
  - `<title>` : « Schéma du système UGB Link : le navigateur passe par Nginx, installé sur la machine virtuelle, qui sert le front React et relaie l'API Express. Dans Docker Compose, l'API s'appuie sur PostgreSQL, Redis, MinIO et Ollama ; l'OCR tourne dans l'API. GitHub Actions déploie sur le serveur ; une sauvegarde nocturne part vers un stockage distant. ».
- [ ] `FeaturedCase` (planche 1, lignes 193 à 351) :
  - utilise `projet.lignesStatut`, les étiquettes (`stack` avec icône et `stackLibelles` sans icône) et `<UgbLinkDiagram/>` ;
  - légende « Fig. 01 — Système en production — une VM, conteneurs Docker » ;
  - bouton « Lire l'étude de cas → » vers `/projets/<slug>`.
- [ ] `ArticleList` (planche 1, lignes 543 à 565) : date ISO `yyyy-mm-dd`, titre lié, « n min de lecture ».
- [ ] `Testimonial` (planche 1, lignes 509 à 520) sans l'étiquette `pa-todo`. Il n'est rendu que pour des recommandations réelles.
- [ ] `app/page.tsx`, dans l'ordre de la planche 1 (lignes 24 à 566) :
  - l'accroche (h1 `pa-hero`, liens vers `/projets/ugb-link`, `/projets` et `/blog`. **Si aucun article n'est publié**, « ce que j'apprends » devient un texte simple sans lien) ;
  - le portrait ;
  - la ligne de méta avec les boutons (« Voir l'étude de cas UGB Link » vers `/projets/ugb-link`) ;
  - `IntroBand` ;
  - la section « 01 / Domaines » ;
  - `FactStrip` ;
  - « 02 / Étude de cas » avec le projet `misEnAvant` ;
  - « 03 / Autres dossiers », qui affiche les autres projets publiés ;
  - « 04 / Recommandations », **seulement si** `site.recommandations.length > 0` ;
  - « 05 / Blog », **seulement si** des articles sont publiés, avec les trois plus récents.

  Les numéros de section se calculent selon les sections affichées, pour qu'il n'y ait jamais de trou.
- [ ] Vérifier : `pnpm build` passe (les MDX de la tâche 8 n'existent pas encore : prévoir un fichier `content/projets/ugb-link.mdx` minimal publié, complété à la tâche 8).
- [ ] Commit : `feat(accueil): composants du système de design et page d'accueil`.

### Tâche 7 : page Projets et filtres

**Fichiers :** `app/projets/page.tsx`, `components/FilterTabs.tsx`, `components/ProjectGrid.tsx`

**Interfaces :**
- consomme `filtrerProjets` et `lireCategorie` ;
- produit `<ProjectGrid projets={Projet[]} />` (client), qui lit `useSearchParams()`.

- [ ] `app/projets/page.tsx` (planche 3, lignes 24 à 39) :
  - méta « Index des dossiers », titre « Projets. » (classe `pa-hero pa-rise pa-hero-xl`, le style 120 px ajouté dans la section « Ajouts » de `plan.css`, ramené à 64 px sous 768 px) et chapô ;
  - puis `<Suspense><ProjectGrid/></Suspense>`.
- [ ] `ProjectGrid` :
  - `FilterTabs` (`div.pa-tabs[role=group]`, un bouton par catégorie en plus de « Tous », avec `aria-pressed`) ;
  - un compteur « n dossier(s) » dans un `aria-live="polite"` ;
  - la grille `pa-grid` des `ProjectCard` filtrés.

  Au clic : `router.replace("/projets?categorie=<cle>", { scroll: false })`, ou `/projets` pour « Tous ». Sans JavaScript, le rendu statique montre tous les projets.
- [ ] Commit : `feat(projets): index filtrable par catégorie`.

### Tâche 8 : études de cas en MDX

**Fichiers :** `app/projets/[slug]/page.tsx`, `components/mdx.tsx`, `components/DecisionRecord.tsx`, `components/ContraintesList.tsx` (`pa-list`), `components/OpsGrid.tsx`, `components/BeforeFlows.tsx`, `components/TableOfContents.tsx`, `components/Figure.tsx`, `components/Gallery.tsx`, `components/CodeBlock.tsx`, `components/Callout.tsx`, `components/MetaBand.tsx`, `components/NextCase.tsx`, `content/projets/ugb-link.mdx`, `content/projets/plusutra.mdx`, `content/projets/gamecupsn.mdx`, `content/projets/hackathon-mcn.mdx`

**Interfaces produites :**
- `mdxComponents` : `DecisionRecord`, `Liste`, `OpsGrid`, `FluxAvant`, `SchemaUgbLink`, `Figure`, `Galerie`, `Callout`, `pre` / `code` → `CodeBlock` ;
- `h2` rendu avec `id` égal au slug, et le méta « 0n / Titre » au-dessus, conformément à la planche 4, lignes 104 à 107.

- [ ] `DecisionRecord` : props `{ numero: string; titre: string; statut?: string; contexte: string; options: { libelle: string; note?: string; retenue?: boolean }[]; decision: string; consequences: string }`. Structure : planche 4, lignes 269 à 307.
- [ ] `TableOfContents` (client) :
  - `aside.pa-toc`, liste des `sections` ;
  - `IntersectionObserver` qui pose `aria-current="true"` sur la section visible ;
  - bouton « Télécharger le CV ».
- [ ] La page `app/projets/[slug]/page.tsx` :
  - `generateStaticParams` à partir de `getProjets()` ;
  - `dynamicParams = false` ;
  - `generateMetadata` (titre = `titre`, description = `resume`) ;
  - en-tête de la planche 4, lignes 24 à 59 (fil « Projets / dossier-0n », méta, h1 = `accroche`, chapô = `resume`, `MetaBand` avec rôle, période, statut et stack, **chaque ligne rendue seulement si sa valeur existe**) ;
  - grille `pa-casegrid` (sommaire à gauche, `MDXRemote` à droite) ;
  - `NextCase` : « ← Index » et le dossier suivant, avec un retour au premier après le dernier.
- [ ] `content/projets/ugb-link.mdx`, avec le frontmatter complet et ces sections (textes de la planche 4, corrigés) :
  - `lignesStatut` : `nginx · proxy inverse (hôte)` en production, `backend · express + ocr` en production, `ollama · llm` en production, `sauvegarde · nocturne` opérationnel ;
  - `stack` : `[nodedotjs, postgresql, docker, nginx, ollama]`, avec `stackLibelles` vide. L'étiquette Ollama s'affiche « IA auto-hébergée » grâce au champ `libelles: { ollama: "IA auto-hébergée" }` du frontmatter (défini en tâche 4) ;
  - `miniSchema` : `[{titre:"Nginx",sous:":443"},{titre:"API",sous:"Express"},{titre:"PostgreSQL",sous:"données"}]` ;
  - `## Contexte` avec `<FluxAvant/>` (candidatures/excel, courrier/papier, copies d'examens/papier, paiements/téléphone) ;
  - `## Contraintes` avec `<Liste prefixe="C" items={[…4 contraintes]}/>` ;
  - `## Architecture` avec `<SchemaUgbLink/>` et la légende corrigée : « Nginx, installé sur la machine virtuelle, sert le front React et relaie `/api` vers Express ; les services tournent en conteneurs Docker. GitHub Actions déploie ; une sauvegarde nocturne part hors site. » ;
  - `## Décisions` : les trois ADR de la planche 4. Dans ADR-03, la phrase devient « Les incidents de production ont donné lieu à des cas de non-régression. », suivie de la contrepartie ;
  - `## Exploitation` : `<OpsGrid>`, avec ops-01 « GitHub Actions construit l'application, la déploie par SSH, puis vérifie que le site public répond. » et ops-02 à ops-04 tels que dans la planche ;
  - `## Résultats` : `<Liste prefixe="R" …/>` avec les quatre résultats ;
  - **pas de section Captures** tant que `public/captures/ugb-link/` est vide ;
  - `## Ce que je referais autrement` : les trois points.
- [ ] `plusutra.mdx`, `gamecupsn.mdx`, `hackathon-mcn.mdx` : frontmatter conforme à la planche 3, lignes 42 à 272 (catégories : UGB Link `backend, infrastructure, ia` ; PlusUtra `full-stack` ; GamecupSN `backend, full-stack` ; hackathon `full-stack`) avec leur `miniSchema`, et un corps court composé uniquement de faits connus :
  - **PlusUtra** — Contexte : application web progressive personnelle qui fonctionne hors connexion. Architecture : actions mises en file d'attente localement (IndexedDB) puis synchronisées au retour du réseau, mise à jour optimiste ; Next.js, TypeScript, tRPC, Drizzle ORM, PostgreSQL, notifications push. Résultats : tests unitaires (Vitest) et tests de bout en bout (Playwright) en place ; projet en cours.
  - **GamecupSN** — Contexte : organisation de tournois Valorant pour la scène sénégalaise, projet mené à trois. Architecture : React et Vite, API Express en TypeScript, PostgreSQL ; modèle de données séparant l'identité des joueurs des données de jeu, pour accueillir d'autres jeux. Décisions : génération et progression automatiques des arbres ; paiement hors du premier périmètre. Résultats : en cours de construction.
  - **Hackathon** — Contexte : hackathon du Musée des Civilisations Noires, juillet 2025. Réalisation : parcours de visite mobile-first en React, accès aux œuvres par QR code, audio-guide en synthèse vocale, interface en français, anglais et wolof. `depot: https://github.com/Abdou-Aziz-Sy/hackmuseum`.
- [ ] Vérifier : `pnpm build` génère `/projets/ugb-link`, `/projets/plusutra`, `/projets/gamecupsn` et `/projets/hackathon-mcn`.
- [ ] Commit : `feat(etudes-de-cas): gabarit dossier technique et contenu des quatre projets`.

### Tâche 9 : blog

**Fichiers :** `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `content/blog/modele-de-langage-machine-modeste.mdx`, `content/blog/sse-plutot-que-websocket.mdx`, `content/blog/tests-bout-en-bout.mdx`

- [ ] `app/blog/page.tsx` :
  - si `getArticles()` est vide, `notFound()` ;
  - sinon, méta « Blog », titre `pa-hero pa-hero-xl` « Blog. », et `ArticleList` complète.
- [ ] `app/blog/[slug]/page.tsx` :
  - structure de la planche 5 : colonne gauche (lien « ← Tous les articles », puis `ul.pa-status` publié / lecture / dossier), colonne `var(--measure)` (méta « Blog / <slug> », h1, chapô, bandeau date + étiquettes, corps MDX, lien vers l'étude de cas liée) ;
  - `generateStaticParams` à partir de `getArticles()`, et `dynamicParams = false`.
- [ ] Rédiger les trois articles **à partir de faits vérifiés** dans `\\wsl.localhost\ubuntu-22.04\home\workspace\projects\ugb-link` : `docker-compose.prod.yml` (service `ollama`), `backend/services/documentExtractorService.js` (OCR avec `node-tesseract-ocr`, `pdf-parse`), `backend/controllers/eventsController.js` (SSE), `backend/scripts/tests/P1.*.sh`, `docs/extraction_ia_performance.md`.
  - Les extraits de code sont copiés du dépôt, jamais inventés.
  - Aucune valeur de performance n'est citée si elle n'est pas écrite dans ces fichiers.
  - Chaque article porte `publie: false`, avec une `date` égale au jour de la rédaction, en attendant la validation d'Abdou Aziz.
- [ ] Vérifier : `pnpm build` passe, `/blog` renvoie 404 et la navigation ne montre pas « Blog » (aucun article publié).
- [ ] Commit : `feat(blog): gabarit et trois brouillons d'articles non publiés`.

### Tâche 10 : page À propos

**Fichiers :** `app/a-propos/page.tsx`, `components/Timeline.tsx`, `components/TechList.tsx`

- [ ] Reproduire la planche 6, lignes 24 à 209 :
  - colonne gauche collante (`Frame` « FEUILLE 02 », méta de disponibilité, boutons CV et contact) ;
  - colonne droite : h1 « Ingénieur logiciel, du côté *backend* de l'écran. », chapô ;
  - « 01 / Parcours » avec `Timeline` (`site.parcours`, `is-now` sur l'entrée actuelle) ;
  - « 02 / Domaines » avec `DomainColumn variante="breve"` ;
  - « 03 / Stack » avec `TechList` (`site.stack`).
  - Sous 1024 px, une seule colonne, et la colonne gauche n'est plus collante (ajout dans `plan.css`, classe `pa-aboutgrid`).
- [ ] Métadonnées : titre « À propos ».
- [ ] Commit : `feat(a-propos): parcours, domaines et stack`.

### Tâche 11 : référencement, 404 et partage

**Fichiers :** `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `app/projets/[slug]/opengraph-image.tsx`, `app/not-found.tsx`, `components/JsonLd.tsx`

- [ ] `sitemap.ts` : `/`, `/projets`, `/a-propos`, chaque projet publié, et `/blog` et les articles **seulement s'ils sont publiés**.
- [ ] `robots.ts` : tout autoriser, avec le lien vers le sitemap.
- [ ] `opengraph-image.tsx` (1200×630, `ImageResponse`) :
  - fond `#020a13`, grille dessinée en dégradés linéaires ;
  - méta « DOSSIER — ABDOU AZIZ SY » en `#8c9299`, titre en `#e1e1e1`, point final en `#7fb3e0`.
  - Version projet : « DOSSIER 0n — TITRE » et l'accroche.
- [ ] `JsonLd` dans le gabarit : `Person` (nom, `jobTitle` « Ingénieur logiciel », adresse Dakar, `sameAs` = les liens définis, `email`).
- [ ] `not-found.tsx` : méta « Erreur 404 », h1 « Cette page n'existe pas. », boutons « Accueil » et « Projets ».
- [ ] Commit : `feat(seo): sitemap, robots, images Open Graph, JSON-LD et page 404`.

### Tâche 12 : tests de bout en bout, CI et README

**Fichiers :** `tests/e2e/navigation.spec.ts`, `tests/e2e/projets.spec.ts`, `tests/e2e/theme.spec.ts`, `tests/e2e/liens.spec.ts`, `.github/workflows/ci.yml`, `README.md`

- [ ] `navigation.spec.ts` :
  - chaque route (`/`, `/projets`, `/projets/ugb-link`, `/a-propos`) renvoie 200 et contient un `h1` ;
  - le lien « Me contacter » pointe vers `#contact` ;
  - `/blog` renvoie 404 tant qu'aucun article n'est publié ;
  - « À remplir » n'apparaît nulle part ;
  - « worker-ia » et « adresse@exemple.sn » n'apparaissent nulle part.
- [ ] `projets.spec.ts` : un clic sur « Infrastructure » met l'URL à `?categorie=infrastructure`, laisse 1 carte (UGB Link) et affiche le compteur « 1 dossier » ; un clic sur « Tous » en affiche 4.
- [ ] `theme.spec.ts` : `data-theme` vaut `dark` au départ ; après un clic sur le bouton de thème, il vaut `light` et le reste après rechargement.
- [ ] `liens.spec.ts` :
  - collecter tous les `a[href^="/"]` des pages principales et vérifier que chacun renvoie un statut inférieur à 400 ;
  - sur le projet `mobile`, `document.documentElement.scrollWidth <= innerWidth` sur `/` et `/projets/ugb-link`.
- [ ] Lancer `pnpm exec playwright install chromium` puis `pnpm test:e2e` : tout passe.
- [ ] `ci.yml` (Node 24, pnpm 10) : `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test`, `build`, `playwright install --with-deps chromium`, `test:e2e`. Déclenché sur `push` vers `main` et sur `pull_request`.
- [ ] `README.md` : présentation, commandes, organisation du contenu (ajouter un projet = un fichier MDX), procédure pour publier un article, éléments à fournir (spec, section 9).
- [ ] Commit : `test: parcours de bout en bout, CI GitHub Actions et README`.

### Tâche 13 : vérification finale et déploiement

- [ ] Exécuter `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.
- [ ] Contrôle visuel des pages principales, en thème sombre et clair, sur ordinateur et mobile, en comparant aux planches ; corriger les écarts.
- [ ] Mesurer Lighthouse (mobile) sur `/` et `/projets/ugb-link` ; corriger si un score passe sous 95.
- [ ] Créer le dépôt public GitHub `Abdou-Aziz-Sy/portfolio` (`gh repo create … --public --source . --push`), en vérifiant avant que `.work/` n'est pas suivi.
- [ ] Déployer sur Vercel (projet `portfolio`, production depuis `main`). Si l'authentification Vercel n'est pas disponible dans cet environnement, s'arrêter à cette étape et donner la procédure d'import du dépôt à Abdou Aziz.
- [ ] Vérifier l'URL de production : pages principales en 200, `/cv.pdf` téléchargeable.
- [ ] Commit final éventuel, puis mise à jour de la mémoire du projet.
