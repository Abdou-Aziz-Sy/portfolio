# Chantier 2 — Refonte responsive, grands écrans compris

Date : 17 septembre 2026. Branche : `feat/refonte-ux`. Prérequis : chantier 1 (`2026-09-17-corrections-audit-design.md`) livré.

## Objectif

Aujourd'hui la page est figée à 1 200 px (`--page-max`) et reste une colonne centrée sur les grands écrans ; sur mobile et tablette, le haut de page repousse les actions hors de l'écran et les schémas sont illisibles. Le site doit exploiter toute largeur entre 320 et 2 560 px sans jamais sacrifier la lisibilité du texte.

Choix validés avec l'auteur (maquettes du compagnon visuel) : grand écran **B · fluide avec breakout** ; première vue mobile **B · compact, action d'abord** ; schémas **B · simplifié sur l'accueil, complet dans l'étude**.

## A. Système de mise en page

- **Emplacement.** `styles/plan.css` reste généré et intouché. La refonte vit dans un nouveau fichier `styles/mise-en-page.css`, importé après `plan.css` et avant `ajouts.css`. Les règles de débordement du chantier 1 y sont déplacées si elles concernent la mise en page.
- **Jetons** (déclarés dans `mise-en-page.css`, pas dans `tokens.css` qui est généré) :
  - `--content-max: 1920px` remplace l'usage de `--page-max` par `.pa-wrap` ;
  - `--gutter: clamp(16px, 4vw, 96px)` pour le `padding-inline` de `.pa-wrap` ;
  - `--prose-max: 68ch` pour tout paragraphe courant, chapeau et liste de texte.
- **Breakout.** `.pa-wrap` garde la largeur de contenu ; les blocs de texte sont bornés à `--prose-max`. Les schémas, grilles, bandeaux (faits, CTA, pied de page, fiche de décision) occupent toute la largeur de `.pa-wrap`. Le quadrillage de fond reste pleine largeur.
- **Points de rupture** : 480, 768, 1024, 1440, 1920 px (requêtes `min-width`, en plus des `max-width` hérités de `plan.css` qu'on surcharge).
- **Grille de projets** : `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`, bornée à 4 colonnes (à partir de 1440 px). La grille de la stack (`.pa-techs`) suit la même logique.
- **Typographie fluide** (`clamp()`, interpolation entre 375 et 2560 px) :
  - `.pa-hero` : 34 px → 84 px ; `.pa-h1` : 32 px → 64 px ; `.pa-h2` : 24 px → 40 px ; `.pa-cta h2` : 34 px → 64 px ;
  - `.pa-lead` : 18 px → 22 px ; texte courant 16 px → 18 px ; interlignes proportionnels.
- **Faible hauteur** : `@media (max-height: 500px)` → `.pa-nav` en `position: static`.

## B. Pages

### Accueil
- **< 768 px** (option B) : surtitre avec le nom (chantier 1), titre raccourci à « Je construis des backends qui tiennent *en production* et je dessine des systèmes *avant* de les coder. » ; puis boutons « Voir les projets » et « CV » ; puis les trois premiers faits de `site.faits` en ligne compacte ; puis le cartouche, réduit. Critère : sur un écran de 375 × 812, nom, titre, boutons et faits visibles sans défilement.
- **< 1024 px** : héros sur une colonne (fin des deux colonnes étroites en tablette).
- **≥ 1440 px** : cartouche et schéma de la carte vedette agrandis proportionnellement.
- **Domaines** : deux colonnes entre 768 et 1023 px. **Bandeau « Présentation »** aligné sur la grille de contenu.
- Le titre long (version bureau) reste celui défini au chantier 1 à partir de 768 px.

### Schémas
- **Carte vedette** : nouveau composant `UgbLinkDiagramSimple` (4 blocs : Navigateur, API Node, PostgreSQL, OCR + LLM), libellés ≥ 11 px rendus, accompagné d'un lien « Voir le schéma complet » vers `/projets/ugb-link#architecture`. Le schéma complet n'est plus utilisé sur l'accueil.
- **Étude de cas** : `UgbLinkDiagram` en pleine largeur de contenu. Sous 768 px, il garde une largeur minimale lisible et défile dans son cadre (`.pa-diagram-scroll`), avec un dégradé et une flèche en bord droit tant qu'il reste du contenu à droite. Le cadre reçoit `tabindex="0"`, un rôle `region` et un nom accessible uniquement quand il déborde réellement (mesure côté client).
- Les mini-schémas des cartes de projet gardent leur rendu, avec des libellés ≥ 11 px.

### Études de cas
- ≥ 1024 px : sommaire latéral collant ; colonne de texte bornée à `--prose-max` ; schémas et fiches de décision sur toute la largeur de la colonne principale.
- < 1024 px : sommaire replié au-dessus du contenu (comportement actuel conservé).

### Projets, À propos, blog, 404
Mêmes jetons de largeur, de marge et de typographie ; `.pa-aboutside` et les listes d'articles suivent les points de rupture ci-dessus.

## C. Vérification

- Test e2e anti-débordement paramétré sur 320, 375, 768, 1024, 1440, 1920 et 2560 px, pour toutes les pages ; plus un cas à 1280 px avec zoom 200 %.
- Test e2e de première vue mobile : à 375 × 812, le nom, le bouton « Voir les projets » et le premier fait sont dans la fenêtre sans défilement.
- Test e2e : sur la grille de projets à 1920 px, quatre cartes sur la même ligne.
- Revue visuelle par captures de chaque page aux sept largeurs, thèmes clair et sombre.
- Lighthouse mobile : accessibilité, bonnes pratiques et SEO à 100 ; CLS à 0.

## Hors périmètre

Animations nouvelles (chantier 3). Contenu des études de cas secondaires.
