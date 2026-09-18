# Chantier 1 — Corrections de l'audit UI/UX

Date : 17 septembre 2026. Branche : `feat/refonte-ux`.
Source : audit indépendant du 17/09 (note globale 6,5/10). Ce chantier précède la refonte responsive (chantier 2) et les animations (chantier 3).

## Objectif

Corriger les défauts relevés par l'audit avant toute diffusion du site : le débordement mobile bloquant, l'identité absente de la première vue, les indicateurs trompeurs et les défauts d'interaction et d'accessibilité.

Hors périmètre : refonte des points de rupture, héros mobile, lisibilité des schémas (chantier 2) ; nouvelles animations (chantier 3) ; enrichissement des études de cas (contenu, à fournir par l'auteur).

## A. Mise en page et test

1. **Débordement mobile de l'accueil.** Les grilles `.pa-feature` (et toute grille qui contient un `.pa-diagram-scroll`) utilisent `minmax(0, 1fr)`, et leurs enfants `min-width: 0`. Le schéma défile dans son cadre ; la page ne dépasse jamais la largeur de la fenêtre. La règle vit dans `styles/ajouts.css` (`plan.css` est généré).
2. **Test anti-débordement** (`tests/e2e/liens.spec.ts`). Comparer `document.documentElement.scrollWidth` à `document.documentElement.clientWidth`. Pages couvertes : `/`, `/projets`, les quatre études de cas, `/a-propos`, `/blog`, une URL inexistante (404). Le test est écrit en premier et doit échouer sur le code actuel.

## B. Contenu et identité

3. **Nom visible.** Un surtitre `pa-meta` « Abdou Aziz Sy · Ingénieur logiciel » précède le `h1` de l'accueil. Le logo affiche `site.nom` en toutes lettres à partir de 768 px et `site.initiales` + « . » en dessous. Son nom accessible est le texte visible (pas d'`aria-label` divergent).
4. **Pied de page.** « tous les services opérationnels » est remplacé par `site.disponibilite` suivi de « · Dakar ou à distance » (le libellé complet vit dans `content/site.ts`). La pastille verte est conservée.
5. **Bandeau de contact** (`CtaBand`). Ajouter le lien GitHub, le lien LinkedIn quand `site.liens.linkedin` est défini, l'adresse e-mail affichée en clair et un bouton « Copier ». Après copie, le bouton affiche « Copié » pendant 2 s et une région `aria-live="polite"` annonce « Adresse copiée ». En cas d'échec de l'API presse-papiers, le bouton affiche « Copie impossible » et l'adresse reste sélectionnable.
6. **Titre de l'accueil.** La proposition « et j'écris sur ce que j'apprends en chemin » n'apparaît que s'il existe au moins un article publié ; sinon la phrase se termine après « avant de les coder ».
7. **CV.** Les trois liens (`Button`, `Footer`, `TableOfContents`) portent `download="CV_Abdou_Aziz_SY.pdf"`.
8. **404.** Métadonnée `title` : « Page introuvable ».
9. **Petits correctifs.**
   - séparateurs de `.pa-meta` en `var(--ink-faint)` au lieu de `var(--line-strong)` (contraste 3,45:1 → conforme) ;
   - statut « Terminé » de l'étude de cas en `var(--ink-muted)` (`app/projets/[slug]/page.tsx`) ;
   - statut « Acceptée » des fiches de décision : pastille dédiée, distincte de « en cours » (`DecisionRecord`) ;
   - métadonnées : `white-space: nowrap` par segment, retour à la ligne entre segments seulement ;
   - `/projets` : un `h2` (éventuellement visuellement masqué) au-dessus de la grille ;
   - `Frame` : « Initiales d'Abdou ».

## C. Interactions

10. **En-tête mobile** (< 768 px). Le bouton de thème devient une icône soleil/lune, cible de 44 × 44 px, avec un nom accessible explicite (« Thème clair » / « Thème sombre ») et un `title` identique. Le bouton « Me contacter » réapparaît dans l'en-tête. À partir de 768 px, le bouton garde son libellé « Papier / Nuit » et son nom accessible commence par ce libellé (WCAG 2.5.3).
11. **Cartes de projet.** Le lien « Ouvrir le dossier » est étendu à toute la carte par un pseudo-élément (`::after` en `position: absolute; inset: 0`). Un seul lien par carte pour les technologies d'assistance. Les étiquettes restent non interactives. L'effet de soulèvement au survol est conservé et s'applique aussi à `:focus-within`.
12. **Menu mobile.** Échap ferme le menu et rend le focus au bouton « Menu ». Un clic hors du panneau ferme le menu sans déplacer le focus : un clic ailleurs sur la page ne doit pas voler le focus à l'endroit où l'utilisateur vient d'interagir. Un clic sur un lien du panneau ferme le menu sans déplacer le focus sur le bouton non plus.
13. **URL de production.** `siteUrl()` lève une erreur quand `VERCEL_ENV === "production"` et qu'aucune de `NEXT_PUBLIC_SITE_URL` et `VERCEL_PROJECT_PRODUCTION_URL` n'est définie. Hors production, le repli `http://localhost:3000` est conservé.

## Tests

- e2e (bureau et mobile selon le cas) : surtitre et nom du logo visibles ; « Me contacter » visible dans l'en-tête mobile ; clic au centre d'une carte → étude de cas ; Échap ferme le menu et rend le focus au bouton, un clic extérieur ferme le menu sans déplacer le focus ; attribut `download` des liens CV ; titre de la 404 ; texte du pied de page ; bouton « Copier » (état « Copié »).
- unitaire : les trois cas de `siteUrl()` (variable explicite, variable Vercel, production sans URL → erreur).
- Chaîne complète verte : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

## Critères de réussite

- Aucune page ne défile horizontalement entre 320 et 2560 px, ni à 200 % de zoom à 1280 px.
- Le nom complet est lisible sans défilement sur toutes les largeurs.
- Aucune information fausse ou écrite en dur ne se présente comme un état réel.
- Lighthouse accessibilité reste à 100 et ne relève plus d'écart libellé / nom accessible.
