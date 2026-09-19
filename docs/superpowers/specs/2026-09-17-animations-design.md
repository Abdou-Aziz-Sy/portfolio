# Chantier 3 — Animations avancées et utiles

Date : 17 septembre 2026. Branche : `feat/refonte-ux`. Prérequis : chantiers 1 et 2 livrés (les animations se posent sur la mise en page finale).

## Objectif

Rendre le site vivant sans le rendre bavard. Chaque animation a une fonction : orientation, mise en évidence, continuité ou retour d'action. Fil conducteur : **le plan se dessine, puis on peut le lire**.

Six animations retenues sur huit proposées (catalogue du compagnon visuel). Écartées : compteurs de chiffres (valeurs trop petites, effet sans preuve) et réticule suivant la souris (décoratif, coûteux, inutile au toucher).

## Règles communes

1. **Mouvement réduit.** Sous `@media (prefers-reduced-motion: reduce)`, toute animation est supprimée (pas seulement raccourcie) ; l'état final est appliqué immédiatement. Les transitions de vue sont désactivées via `@view-transition { navigation: none; }` sous la même requête.
2. **Aucune boucle infinie.** L'audit a mesuré une fréquence d'affichage divisée par deux à cause des animations en boucle existantes (`pa-packet`, `pa-march`, `pa-pulse`, `pa-blink`). Ces animations sont revues dans ce chantier : jouées une fois à l'apparition, ou limitées à 3 cycles.
3. **Propriétés animées** : uniquement `opacity`, `transform`, `clip-path`, `stroke-dashoffset` et les variables de couleur. Jamais `width`, `height`, `top`/`left` ni `margin`.
4. **Durées** : 150–300 ms pour un changement d'état, 400–700 ms pour une entrée, progression liée au défilement pour les animations de lecture.
5. **Sans JavaScript**, tout le contenu reste visible et lisible : les animations au défilement sont en CSS natif, et les états initiaux ne masquent jamais le contenu (pas d'`opacity: 0` persistant).
6. **Priorité au CSS natif** (`animation-timeline: view()` / `scroll()`), qui s'exécute hors du fil principal. JavaScript seulement pour le schéma explorable et le cercle de thème.
7. **Repli** : sur un navigateur sans prise en charge, le contenu s'affiche dans son état final, sans animation ni erreur.

## Les six animations

### 1. Le schéma se construit au défilement — orientation
- Où : `UgbLinkDiagram` (étude de cas), mini-schémas des cartes.
- Comment : `animation-timeline: view()` sur le conteneur ; les blocs apparaissent (opacité + translation de 8 px), puis les flux se tracent par `stroke-dashoffset` avec `pathLength="1"`, dans l'ordre du trajet d'une requête (client → nginx → API → données).
- `animation-range: entry 20% cover 60%` pour que le schéma soit terminé avant d'atteindre le milieu de l'écran.
- Les blocs portent déjà leur texte dans le DOM : aucun contenu n'est masqué au lecteur d'écran.

### 2. Schéma explorable au survol et au clavier — mise en évidence
- Où : schéma complet de l'étude de cas.
- Chaque bloc est un `<g>` focalisable (`tabindex="0"`, `role="button"`, nom accessible). Au survol ou au focus : ses flux passent en `--accent`, les autres blocs tombent à 35 % d'opacité, et une ligne d'explication s'affiche sous le schéma (zone fixe, pas d'infobulle flottante).
- Le texte d'explication vit dans une liste `<dl>` sous le schéma, visible sans interaction sur mobile (aucune information réservée au survol — WCAG 1.4.13).
- Échap ou perte de focus rétablit l'état neutre.

### 3. La carte devient l'en-tête de l'étude — continuité
- Où : `/projets` (et grille de l'accueil) → `/projets/[slug]`, et retour.
- `<ViewTransition>` de React (Next 16, sans configuration) avec un `name` dérivé du slug, posé sur le titre et le mini-schéma de la carte, et sur leurs équivalents dans l'en-tête de l'étude.
- Durée 300 ms, `ease-out` à l'aller, `ease-in` au retour.

### 4. Filtres qui réorganisent la grille — continuité
- Où : filtres de `/projets`.
- Le changement de filtre passe par une transition de vue ; chaque carte porte un `view-transition-name` unique, donc les cartes conservées glissent à leur nouvelle position pendant que les autres s'effacent (200 ms).
- L'URL et l'état des filtres ne changent pas de comportement ; le compteur de résultats est annoncé par `aria-live`.

### 5. Changement de thème en cercle — retour d'action
- Où : bouton Papier / Nuit.
- Au clic : `document.startViewTransition` (si disponible), puis animation de `clip-path: circle(0 → rayon max)` sur `::view-transition-new(root)`, centrée sur les coordonnées du bouton. Durée 450 ms.
- Sans prise en charge, ou en mouvement réduit : bascule instantanée, comportement actuel.
- Le thème reste appliqué avant peinture par `ThemeScript` (aucun flash).

### 6. Progression de lecture et sommaire vivant — orientation
- Où : études de cas et articles.
- Barre de progression fine en haut de la zone de contenu : `animation-timeline: scroll()`, animée par `transform: scaleX()` (jamais `width`).
- Sommaire : chaque section porte une `view-timeline` nommée ; le lien correspondant s'allume quand sa section occupe l'écran. L'état actif est aussi exposé par `aria-current="location"`.
- Repli sans prise en charge : le sommaire garde son état statique actuel.

## Nettoyage des animations existantes

- `pa-packet` et `pa-march` (flux des schémas) : jouées à l'apparition, 3 cycles maximum, puis arrêt.
- `pa-pulse` (pastille « en production ») et `pa-blink` : remplacées par un état statique ; la pulsation ne porte aucune information.
- `pa-rise`, `pa-tick`, `pa-underline` : conservées, déclenchées par `view()` au lieu d'un délai fixe.

## Vérification

- e2e : avec `prefers-reduced-motion: reduce`, aucune animation ne s'exécute (`getAnimations()` vide après chargement) et tout le contenu est visible ; le schéma explorable répond au clavier ; la barre de progression atteint 100 % en bas de page ; la navigation carte → étude fonctionne sans transition sur un moteur qui ne la gère pas.
- Accessibilité : nom accessible de chaque bloc du schéma ; aucune information disponible au seul survol ; Lighthouse accessibilité à 100.
- Performance : Lighthouse mobile avant / après ; CLS à 0 ; mesure de la fréquence d'affichage au défilement de l'accueil et d'une étude de cas (processeur ralenti 4×), qui doit rester au-dessus de 50 images par seconde.
- Revue visuelle : captures aux étapes clés de chaque animation.

## Hors périmètre

Toute animation non retenue au catalogue. Refonte du contenu des études de cas.
