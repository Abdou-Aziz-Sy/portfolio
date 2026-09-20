# Portfolio — Abdou Aziz Sy

Site personnel d'un ingénieur logiciel à Dakar, orienté backend, conception de systèmes et infrastructure.

- **Pile** : Next.js 16 (App Router, rendu statique), TypeScript, MDX (`next-mdx-remote`), Zod, Vitest, Playwright.
- **Design** : système « Plan d'architecte », conçu avec Claude Design et copié dans [`docs/design/`](docs/design/).
- **Spécification** : [`docs/superpowers/specs/2026-09-17-portfolio-design.md`](docs/superpowers/specs/2026-09-17-portfolio-design.md).

## Commandes

```bash
pnpm install
pnpm dev            # serveur de développement
pnpm build          # build de production (échoue si un contenu est invalide)
pnpm lint
pnpm typecheck      # génère les types des routes puis lance tsc
pnpm test           # tests unitaires
pnpm test:e2e       # tests de bout en bout (Edge en local, Chromium en CI)
```

Scripts de génération, à relancer quand la maquette change :

```bash
pnpm tokens     # styles/tokens.css depuis docs/design/tokens.json
pnpm port-css   # styles/plan.css depuis docs/design/components/bundle.css
pnpm icons      # public/icons.svg depuis les planches
```

`styles/ajouts.css` contient ce qui n'existe pas dans la maquette (menu mobile, grilles de pages, points de rupture) ; il n'est jamais régénéré.

## Contenu

| Élément | Fichier |
|---|---|
| Identité, liens, faits chiffrés, domaines, parcours, stack, recommandations | `content/site.ts` |
| Un projet | `content/projets/<slug>.mdx` |
| Un article | `content/blog/<slug>.mdx` |
| CV téléchargeable | `public/cv.pdf` |
| Portrait | `public/portrait.jpg`, puis `portrait: "/portrait.jpg"` dans `content/site.ts` |

Le frontmatter est validé par `lib/schemas.ts` : un champ manquant ou invalide fait échouer le build en citant le fichier.

### Ajouter un projet

Créer `content/projets/<slug>.mdx` avec le frontmatter complet (voir `gamecupsn.mdx`). Chaque titre `##` devient une section numérotée et une entrée du sommaire. Composants disponibles dans le MDX : `Prose`, `Liste`, `Contexte`, `DecisionRecord`, `Exploitation`, `Galerie`, `Callout`, `Figure`, `SchemaUgbLink`.

Pour des captures, déposer les images dans `public/captures/<slug>/`, puis ajouter une section :

```mdx
## Captures

<Galerie images={[{ src: "/captures/ugb-link/tableau-de-bord.png", legende: "Tableau de bord des appels", largeur: 1600, hauteur: 1000, large: true }]} />
```

Les captures d'UGB Link se prennent sur le jeu de données de démonstration, jamais sur la production.

### Publier un article

Les articles sont rédigés avec `publie: false`. Pour les relire en local :

```bash
AFFICHER_BROUILLONS=1 pnpm build && pnpm start
```

Les brouillons s'affichent alors avec un bandeau « Brouillon » et ne sont pas indexés. En production Vercel, ils restent toujours masqués. Pour publier, passer `publie: true` et ajuster la `date`. La navigation « Blog », la page `/blog` et la section « Derniers articles » apparaissent dès le premier article publié.

## Règles de contenu

- Aucun chiffre inventé : seuls les faits de `site.faits` s'affichent en grand.
- Aucun contenu fictif en ligne : les recommandations, le blog, les captures, le portrait et les liens sans URL restent masqués tant qu'ils manquent.
- Toute affirmation technique sur un projet se vérifie dans son dépôt avant publication.

## Déploiement

Vercel, production depuis `main` (https://portfolio-gamma-rosy-74.vercel.app), prévisualisation par pull request. Ne fusionner qu'avec une CI verte : les e2e locaux tournent sous Edge et Windows, la CI sous Chromium et Linux. L'URL affichée dans le pied de page et le sitemap vient de `NEXT_PUBLIC_SITE_URL`, sinon de l'URL de production Vercel.
