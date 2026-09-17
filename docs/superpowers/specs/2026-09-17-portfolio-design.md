# Portfolio d'Abdou Aziz Sy — spécification

- **Date** : 17 septembre 2026
- **Statut** : à relire par Abdou Aziz Sy
- **Maquette de référence** : système de design « Plan d'architecte » (Claude Design), copié dans `docs/design/` — https://claude.ai/artifact/UY4F2QwSFy7J2zj8XD7XCW

## 1. Objet

Un site personnel qui sert à **décrocher un poste backend ou full stack à Dakar**. Les visiteurs sont des recruteurs et des responsables techniques. Ils ont souvent déjà le CV et viennent vérifier le travail. Chaque page mène à deux actions, dans cet ordre : voir le travail, puis contacter Abdou Aziz. Le bouton « Me contacter » reste visible en permanence.

Le site présente Abdou Aziz comme un ingénieur logiciel **orienté backend, conception de systèmes et infrastructure**. Ces trois orientations s'affichent comme des domaines, jamais comme des titres (« architecte », « ingénieur DevOps »).

Le site est en français. Le dépôt est public sur GitHub : il prouve à lui seul la stack annoncée (Next.js, TypeScript).

## 2. Sources de vérité

| Sujet | Source |
|---|---|
| Couleurs, typographies, espacements, rayons | `docs/design/tokens.json` |
| Règles de contenu et fondations visuelles | `docs/design/README.md` |
| Styles des composants et animations | `docs/design/components/bundle.css` (préfixe `pa-`) |
| Mise en page de chaque page | `docs/design/components/Planche-*/preview.html` |
| Logos des technologies | Groupe d'assets « Icônes » du système de design (16 SVG Simple Icons) |

**En cas d'écart, les faits de la section 7 l'emportent sur la maquette**, car celle-ci contient des affirmations techniques inexactes.

## 3. Pages et routes

| Route | Planche | Contenu |
|---|---|---|
| `/` | 1, 2, 7 | Accroche, portrait, présentation, trois domaines, faits chiffrés, étude de cas mise en avant, autres projets, recommandations, derniers articles, bandeau de contact |
| `/projets` | 3 | Titre « Projets. », filtres, grille de tous les dossiers |
| `/projets/[slug]` | 4 | Étude de cas au format dossier technique, avec sommaire latéral fixe |
| `/blog` | 5 (liste) | Liste des articles publiés |
| `/blog/[slug]` | 5 | Article, colonne de lecture de 680 px, lien vers l'étude de cas associée |
| `/a-propos` | 6 | Portrait, parcours en frise, domaines, stack principale |
| `/cv.pdf` | — | CV en une page, version sans photo (`CV_Abdou_Aziz_SY.pdf`) |
| `/sitemap.xml`, `/robots.txt` | — | Générés |
| page 404 | — | Dans le même style, avec un lien vers l'accueil et les projets |

Il n'y a pas de page Contact dédiée. « Me contacter » pointe vers le bandeau `#contact`, présent en bas de chaque page. Ce bandeau propose un lien `mailto:`, LinkedIn et GitHub. **Aucun formulaire en V1.**

Les sections de chaque page suivent l'ordre et le contenu des planches, aux corrections de la section 7 près.

## 4. Architecture

### 4.1 Pile technique

- **Next.js 16** (App Router), **TypeScript** en mode strict, rendu statique de toutes les pages (`generateStaticParams` pour les pages projet et article).
- **Contenu en MDX** : un fichier par projet dans `content/projets/`, un par article dans `content/blog/`, rendu avec `next-mdx-remote`.
- Frontmatter validé par un schéma **Zod** au moment du build : un champ manquant ou invalide fait échouer le build.
- Polices servies par `next/font/google` (Schibsted Grotesk, DM Serif Display, JetBrains Mono), sans requête vers Google au chargement.
- Hébergement **Vercel** : une adresse `*.vercel.app` pour commencer, avec une prévisualisation par pull request. Le nom de domaine viendra plus tard, sans changement de code.
- Gestionnaire de paquets : **pnpm**.

### 4.2 Arborescence

```
app/
  layout.tsx              polices, thème, navigation, bandeau de contact, pied de page
  page.tsx                accueil
  projets/page.tsx        index filtrable
  projets/[slug]/page.tsx étude de cas
  blog/page.tsx           liste
  blog/[slug]/page.tsx    article
  a-propos/page.tsx
  not-found.tsx
  sitemap.ts, robots.ts, opengraph-image.tsx
components/               un composant par élément du système de design
content/
  projets/*.mdx
  blog/*.mdx
  site.ts                 identité, liens, faits chiffrés, domaines, parcours, recommandations
lib/
  content.ts              lecture et validation du contenu
  schemas.ts              schémas Zod
styles/
  tokens.css              variables des deux thèmes, générées depuis docs/design/tokens.json
  plan.css                bundle.css porté, rendu responsive
public/
  cv.pdf, portrait.jpg, icons/*.svg, captures/<projet>/*
```

### 4.3 Composants

Un composant React par élément du système de design. **Chaque carte de projet, chaque colonne de domaine et chaque fiche de décision utilise un gabarit unique.**

`Navigation`, `Frame` (cartouche du portrait), `IntroBand`, `DomainColumn`, `FactStrip`, `FeaturedCase`, `ProjectCard`, `FilterTabs`, `StatusLine`, `SystemDiagram`, `DecisionRecord`, `Callout`, `CodeBlock`, `TableOfContents`, `Timeline`, `Testimonial`, `ArticleList`, `Tag`, `TechIcon`, `CtaBand`, `Footer`, `Button`, `ThemeToggle`.

Les composants utilisés dans les fichiers MDX (`DecisionRecord`, `Callout`, `SystemDiagram`, `StatusLine`, `Figure`) sont exposés au rendu MDX.

### 4.4 Styles

- Le fichier `bundle.css` est **porté tel quel**, avec ses classes `pa-`. Les planches restent ainsi directement comparables au code.
- `tokens.css` déclare les deux thèmes sous forme de variables : `[data-theme="dark"]` (par défaut) et `[data-theme="light"]`, le « tirage papier ».
- **Rendu responsive** : la maquette décline le mobile avec une classe `.pa-m` et n'a aucun point de rupture. Le portage transforme `.pa-m` en règles `@media (max-width: 767px)`. Un point de rupture intermédiaire à 1024 px gère la tablette : grilles sur deux colonnes, sommaire latéral replié au-dessus du contenu.
- Pas de Tailwind : le système de design fournit déjà ses classes, et un second système ferait doublon.

### 4.5 Thème

- Le thème sombre « plan de nuit » s'applique par défaut, conformément à la maquette.
- Un bouton dans la navigation bascule vers le « tirage papier ». Le choix est mémorisé dans `localStorage`.
- Un script en ligne dans `<head>` applique le thème avant le premier affichage, pour éviter le flash du mauvais thème.

### 4.6 Filtres de la page Projets

- Les onglets proposent : Tous · Backend · Full stack · Infrastructure · IA appliquée.
- Le filtrage se fait côté client, à partir du champ `categories` de chaque projet. Le filtre actif s'inscrit dans l'URL (`?categorie=backend`), pour qu'un lien filtré se partage.
- Le compteur affiche le nombre de dossiers visibles.
- Sans JavaScript, tous les projets s'affichent.

### 4.7 Animations

- On reprend les animations de `bundle.css` : paquets qui circulent sur les flux des schémas, pastilles « en production » qui pulsent, apparition de l'en-tête par couches, soulignement des mots-liens, survol des cartes.
- Toutes sont coupées sous `prefers-reduced-motion: reduce`.
- Aucune animation en boucle sur du texte.

### 4.8 Référencement et partage

- Métadonnées propres à chaque page : titre, description, URL canonique.
- Image Open Graph générée pour l'accueil et pour chaque projet et article.
- `lang="fr"`, sitemap et robots.
- Le JSON-LD `Person` renseigne le nom, le métier et les liens.

## 5. Modèle de contenu

### 5.1 Projet — `content/projets/<slug>.mdx`

| Champ | Type | Exemple |
|---|---|---|
| `titre` | texte | UGB Link |
| `accroche` | texte | Une application de gestion interne pour l'Antenne de l'Université Gaston Berger |
| `resume` | texte, une phrase | Huit processus administratifs sortis d'Excel et du papier… |
| `dossier` | entier, unique | 1 |
| `annee` | entier | 2026 |
| `statut` | `en-production` \| `en-cours` \| `termine` | en-production |
| `cadre` | texte | Alternance · Projet personnel · En équipe de trois · Hackathon |
| `categories` | liste parmi `backend`, `full-stack`, `infrastructure`, `ia` | [backend, infrastructure, ia] |
| `stack` | liste de clés d'icônes | [nodedotjs, postgresql, docker, nginx] |
| `role`, `periode` | texte, facultatifs | Ingénieur logiciel en alternance |
| `misEnAvant` | booléen | true pour UGB Link seulement |
| `lignesStatut` | liste `{service, detail, etat}`, facultative | voir section 7 |
| `schema` | identifiant d'un schéma SVG, facultatif | ugb-link |
| `depot`, `demo` | URL, facultatives | |
| `publie` | booléen | false tant que le contenu n'est pas validé |

Le corps MDX suit les sections de la planche 4 : Contexte, Contraintes, Architecture, Décisions, Exploitation, Résultats, Captures, Ce que je referais autrement.

- **Une section vide ne s'affiche pas**, et le sommaire se construit à partir des sections présentes.
- Les projets moins documentés (PlusUtra, GamecupSN, hackathon) peuvent n'avoir que Contexte, Architecture et Résultats.

### 5.2 Article — `content/blog/<slug>.mdx`

| Champ | Type |
|---|---|
| `titre`, `chapo` | texte |
| `date` | date ISO |
| `etiquettes` | liste |
| `projetLie` | slug de projet, facultatif |
| `publie` | booléen |

Le temps de lecture est calculé à partir du texte, jamais saisi à la main.

### 5.3 Données du site — `content/site.ts`

- Identité, e-mail, liens (LinkedIn, GitHub), disponibilité.
- Les **quatre faits chiffrés** (8 processus en production, 13 domaines d'API testés, 2 sites reliés, 260 km).
- Les trois domaines, le parcours et la stack principale.
- Les recommandations.

## 6. Règles de contenu

1. **Aucun chiffre inventé.** Seuls les quatre faits de la section 5.3 s'affichent en chiffres. Un résultat non mesuré s'écrit en toutes lettres.
2. **Aucun contenu fictif en ligne.**
   - La section Recommandations **n'apparaît que si** `site.ts` contient au moins une vraie recommandation. Les emplacements « À remplir » de la maquette ne sont jamais publiés.
   - Un projet ou un article dont `publie` vaut `false` n'est ni affiché ni généré. La section « Derniers articles » et le lien « Blog » de la navigation **disparaissent tant qu'aucun article n'est publié**.
   - La galerie de captures d'un projet n'apparaît que si des captures existent. Les captures d'UGB Link viennent du jeu de données de démonstration, **jamais de la production**, et ne montrent ni nom réel, ni adresse, ni document signé lisible.
   - Le portrait s'affiche seulement quand `public/portrait.jpg` existe. Sinon, le cartouche montre les initiales.
   - Un lien sans URL renseignée dans `site.ts` (LinkedIn, dépôt, démo) n'apparaît nulle part.
3. Les **dates, durées de lecture et extraits d'articles de la maquette sont fictifs**. Les trois articles prévus sont rédigés à partir du dépôt UGB Link, puis validés par Abdou Aziz avant publication :
   - modèle de langage auto-hébergé ;
   - Server-Sent Events plutôt que WebSocket ;
   - tests bout en bout.
4. Le ton suit le README du système de design : première personne, phrases courtes, pas d'emoji, pas de point d'exclamation, pas de niveau de compétence.

## 7. Corrections de la maquette

Vérifiées dans le dépôt UGB Link le 17 septembre 2026.

| Maquette | Réalité — ce que le site affiche |
|---|---|
| E-mail `adresse@exemple.sn` | `abdouazizsy@esp.sn` |
| Service `worker-ia · llm + ocr` | `ollama · llm` ; l'OCR se fait dans le service `backend` |
| `nginx · proxy`, présenté comme un conteneur | Nginx tourne **sur l'hôte**, devant les conteneurs `frontend` et `backend`. Le schéma le place hors de la zone Docker. |
| Services du schéma | Conteneurs réels : `frontend`, `backend`, `postgres`, `redis`, `minio`, `ollama` |
| « GitHub Actions construit, teste puis déploie » | « GitHub Actions construit l'application, la déploie par SSH, puis vérifie que le site public répond. » La suite de tests bout en bout s'exécute à part, contre l'environnement déployé. |
| « Chaque incident de production devient un cas de non-régression » | « Les incidents de production ont donné lieu à des cas de non-régression. » |
| Article : extrait `docker-compose.yml` avec `worker-ia` et une limite de 6 Go | À réécrire à partir du vrai `docker-compose.prod.yml` |
| Dates des articles (2026-09-02, 2026-07-15, 2026-06-10) et durées de lecture | Remplacées par les vraies dates de publication et une durée calculée |
| Pied de page « abdouazizsy.dev » | L'adresse réelle du site, `*.vercel.app` jusqu'à l'achat du domaine |

## 8. Qualité et vérifications

- `pnpm lint`, `pnpm typecheck` et `pnpm build` passent. Le build échoue si le contenu est invalide.
- **Tests unitaires (Vitest)** :
  - schémas de contenu ;
  - calcul du temps de lecture ;
  - filtrage des projets ;
  - masquage des sections vides ou non publiées.
- **Tests de bout en bout (Playwright)** :
  - chaque route répond ;
  - les filtres modifient la grille et l'URL ;
  - le thème bascule et reste mémorisé ;
  - « Me contacter » atteint le bandeau de contact ;
  - aucun lien interne n'est cassé ;
  - l'accueil tient en 375 px de large sans défilement horizontal.
- **Accessibilité** :
  - contraste d'au moins 4,5:1 dans les deux thèmes (valeurs déjà vérifiées dans le système de design) ;
  - navigation complète au clavier, anneau de focus visible ;
  - images avec texte alternatif, schémas SVG avec `role="img"` et libellé.
- **Performance** : Lighthouse mobile ≥ 95 en performance, accessibilité, bonnes pratiques et référencement, sur l'accueil et l'étude de cas.
- **CI GitHub Actions** : installation, lint, typecheck, tests unitaires, build et tests Playwright à chaque pull request. Vercel publie une prévisualisation par pull request et la production depuis `main`.

## 9. À fournir par Abdou Aziz avant la mise en ligne publique

Le site peut être construit et déployé sans ces éléments. Les sections concernées restent masquées tant qu'ils manquent.

1. Portrait (`public/portrait.jpg`, format carré, au moins 800 px).
2. URL du profil LinkedIn.
3. Captures d'UGB Link prises sur le jeu de données de démonstration.
4. Validation des trois articles et des études de cas rédigés.
5. Recommandations réelles, si elles existent.
6. Sources des autres projets à ajouter.

## 10. Hors périmètre de la V1

- Formulaire de contact.
- Version anglaise.
- CMS.
- Commentaires.
- Statistiques de visite.
- Nom de domaine personnalisé.
- Recherche dans le blog.
- Flux RSS.

Chacun pourra être ajouté sans remettre en cause l'architecture.
