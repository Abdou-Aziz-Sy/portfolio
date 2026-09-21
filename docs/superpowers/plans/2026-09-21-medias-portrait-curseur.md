# Plan — Médias des études de cas, nouveau portrait, effet de curseur

> À exécuter dans une **nouvelle conversation** : « Exécute le plan `~/.claude/plans/abstract-squishing-meerkat.md` ».
> Première action de la session : copier ce plan dans `docs/superpowers/plans/2026-09-21-medias-portrait-curseur.md`.

## Contexte

Le portfolio (Next 16.3.5, React 19, MDX dans `content/projets/*.mdx`, prod Vercel) compte cinq études de cas publiées, mais elles ne montrent presque rien du produit : seul GamecupSN a un visuel (`public/schemas/gamecupsn-domaine.svg`). L'auteur veut une identité visuelle par projet (captures annotées et/ou vidéo), en commençant par UGB Link avec ses propres fichiers, dont le logo UGB. Il veut aussi remplacer son portrait (l'actuel coupe ses cheveux et est moins net) et rendre l'accueil moins fade avec un effet de curseur.

## Inventaire déjà fait (`C:\Users\syabd\Downloads\document portfolio\`)

- **Logo UGB** : `image.png`, 240 px de large, basse définition. Chercher une version HD/SVG ; sinon l'utiliser seulement en petit.
- **Captures annotées** (PNG 1920×1080, annotations de l'auteur) : A (bordereaux, fiche/frise historique), B1–B5 (kanban des copies, fiche de signature, réceptions), C (appels à candidature, extraction IA, portail public, décharge/quittance PDF), D1 (calendrier), E1 (tableau de bord haut/bas).
- **Doublons** : les fichiers « (1) » sont identiques octet pour octet, sauf `capA1_fiche_historique_annote (1).png` (taille différente : comparer les deux et garder la meilleure).
- **Vidéos** : les quatre `2026-07-11 07-54-13*.mp4` sont un seul fichier de 7 Mo en quatre copies. `Video Project 1.mp4` fait 36 Mo : trop lourd, il faudra le réencoder. ffmpeg n'est pas installé : utiliser `npx ffmpeg-static`, sans rien installer au niveau du système.
- **Portrait** : déjà copié dans `docs/superpowers/assets-entrants/portrait-nouveau.webp` (hors suivi git ; supprimer ce dossier une fois le fichier déplacé dans `public/`).
- ⚠️ **Données personnelles** : les captures affichent des noms et des numéros de téléphone (« Dr. Fatou MBAYE », « 77 123 45 67 »…). Leur forme laisse penser à des données de démo, mais **il faut que l'auteur le confirme avant publication**. Sinon, flouter.

## Lot 1 — UGB Link, le projet pilote (une PR)

1. **Regarder toutes les captures et les deux vidéos** (extraire des images clés avec ffmpeg), puis garder 6 à 8 captures qui racontent le cycle : bordereau → suivi des copies (B1) → signature (B2) → appels et extraction IA (C2) → portail public (C3) → calendrier (D1) → pilotage (E1). Écarter les redondances.
2. **Composants MDX** dans `components/` (suivre le style de `styles/plan.css` et `ajouts.css`, préfixe `pa-`) :
   - `Capture` : `next/image` avec légende, dimensions explicites (aucun décalage de mise en page), chargement différé, clic pour agrandir dans un `<dialog>` natif (touche Échap, focus rendu à l'élément).
   - `Galerie` : grille de `Capture`, une colonne sur mobile.
   - `Video` : `<video muted loop playsInline preload="none" poster>`, sans lecture automatique si `prefers-reduced-motion`.
   - Les enregistrer à côté des composants MDX existants (le même mécanisme qui sert au diagramme de `gamecupsn.mdx`).
3. **Assets** dans `public/projets/ugb-link/` : les PNG sources (next/image les sert en AVIF/WebP) ; la vidéo réencodée en H.264 720p, 30 s maximum, **moins de 4 Mo**, avec une image d'affiche.
4. **Logo UGB** : dans l'en-tête de l'étude de cas, comme mention du commanditaire (« Université Gaston Berger · antenne de Dakar »), et en petit sur la carte UGB Link de `/projets`. Il ne remplace pas l'identité du portfolio.
5. **Image de couverture** de la carte UGB Link : la capture du kanban (B1), recadrée.
6. **Insertion dans `ugb-link.mdx`** : chaque capture placée dans la section qu'elle prouve, pas une galerie en vrac en fin de page. Garder les faits de la mémoire (l'OCR sert aux appels à candidature ; la restauration est un exercice automatisé, sans PV).

## Lot 2 — Portrait (petite PR, ou même PR que le lot 1)

- Convertir `portrait-nouveau.webp` et remplacer `public/portrait-accueil.jpg` (référencé dans `content/site.ts:27`). Vérifier le cadrage à 375 et à 1440 px (les cheveux ne doivent plus être coupés). Choix par défaut : remplacer **les deux** portraits (`accueil` et `apropos`) si le cadrage de la page À propos le supporte ; sinon, seulement l'accueil.
- Précharger le portrait seulement s'il est le plus grand élément de l'accueil (règle de la mémoire).

## Lot 3 — Effet de curseur sur l'accueil (une PR)

- Charger le skill `impeccable` pour décider de la direction. Proposition : un **halo de lumière** qui suit le pointeur sur la première vue (un dégradé radial piloté par des variables CSS `--x`/`--y` mises à jour dans `requestAnimationFrame`), avec un léger effet magnétique sur les deux boutons d'action.
- Garde-fous : on garde le curseur natif (pas de curseur remplacé) ; effet désactivé si `pointer: coarse` et si `prefers-reduced-motion` ; seules `transform`/`opacity`/variables sont animées ; écouteurs passifs ; composant client isolé, pour ne pas alourdir le reste de la page.
- Suivre les motifs d'animation existants (plan `2026-09-19-animations.md`, `tests/…/mouvement.spec.ts`).

## Lot 4 — Même traitement pour les quatre autres projets (plan seulement, exécution ensuite)

| Projet | Source | Médias visés |
|---|---|---|
| GamecupSN | WSL `…/projects/gamecupsn` | lancer l'app dans le navigateur intégré, 3–4 captures, plus le diagramme UML existant |
| Mentorat VCN | `Documents\Projects\Pro\monitoring_platforme1.0\…` | captures du chat et de la visio, clip court de 15 à 20 s |
| taskhandler | dépôt Spring Boot | backend : Swagger ou requêtes annotées, plus un diagramme de séquence |
| Gestion de stages | API Node | idem ; ne **jamais** montrer le `.env` (secrets exposés, voir la mémoire) |

- **Outil commun** : un script Playwright `scripts/captures/` qui prend les captures et y ajoute des annotations numérotées dans le style du portfolio, pour que les annotations soient reproductibles et homogènes (les captures UGB restent celles de l'auteur).
- Chaque projet fait l'objet de sa propre PR, avec les composants du lot 1 réutilisés tels quels.

## Vérification (à chaque lot)

- `pnpm build` (qui valide aussi le frontmatter YAML), puis les tests unitaires et e2e ; arrêter d'abord les serveurs sur 3000/3001/3100 et tester avec Edge.
- Nouveaux e2e : les captures se chargent, la boîte d'agrandissement s'ouvre et se ferme au clavier, l'effet de curseur est absent en `reduced-motion` et sur tactile.
- Revue visuelle à 375 et à 1440 px (captures d'écran lues).
- Après fusion : lire la CI, puis mesurer avec **PageSpeed Insights** en production (jamais Lighthouse en local).

## Ordre et durée estimée

Lot 2 (15 min) → Lot 1 (1 h 30) → Lot 3 (45 min) → Lot 4, un projet par session.
