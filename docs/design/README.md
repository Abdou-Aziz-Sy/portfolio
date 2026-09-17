Le portfolio d'Abdou Aziz Sy, ingénieur logiciel à Dakar, orienté backend, conception de systèmes et infrastructure. Il sert à décrocher un poste backend ou full stack : des recruteurs et des responsables techniques viennent vérifier qu'il sait faire. Chaque page mène à deux actions, dans cet ordre : **voir le travail**, puis **le contacter**. « Me contacter » reste visible en permanence.

## Contenu et ton

- Tout est en français, à la première personne, phrases courtes et concrètes : « Je construis des backends qui tiennent en production, je dessine des systèmes avant de les coder. »
- Parler de ce que l'utilisateur ne voit pas : services, données, déploiement, pannes.
- **Aucun chiffre inventé.** Seuls les faits connus s'affichent en chiffres (8 processus, 13 domaines d'API testés, 2 sites, 260 km). Un résultat non mesuré s'écrit en toutes lettres.
- Métadonnées au format dossier technique, en `meta` : « DOSSIER 01 — UGB LINK — 2026 — EN PRODUCTION ». Dates ISO `2026-09-02`. Services et chemins en minuscules monospace : « api · en production », `/api`.
- Recommandations : jamais inventées ; l'étiquette « À remplir » reste tant qu'une vraie citation manque.
- Pas d'emojis, pas de point d'exclamation, pas de niveau de compétence.

## Fondations visuelles

**Plan de nuit (thème par défaut `dark`).** Fond `ground` (#020A13) sous une grille millimétrée : lignes `grid` tous les 24px (`grid-pitch`), lignes `grid-major` tous les 120px (classe `pa-ground`). Surfaces en `surface` (#091521), retraits en `surface-2`, filets en `line` (#14202B).

**Couleur.** Texte `ink` (#E1E1E1), secondaire `ink-muted` (#9E9E9C), métadonnées `ink-faint`. Un seul accent : `accent` (#7FB3E0), le bleu de trait de plan, de la famille du bleu ardoise #1F4E79 du CV. `ok` (#3FB68B) est réservé aux statuts « en production » et « opérationnel », toujours avec le mot. Pas de dégradé, pas de verre.

**Tirage papier (thème `light`).** Même plan sur papier clair : `ground` #F3F5F7, `accent` #1F4E79, `ok` assombri en #1B7350 pour rester lisible.

**Typographie.**
- `sans` — Schibsted Grotesk, grotesque affirmée : titres en 700 (`hero`, `h1`, `h2`), `h3` en 600, texte en 400 (`lead`, `body`, `body-reading`, `small`, `label`).
- `accent` — DM Serif Display italique (`accent-italic`), en `accent`, pour un ou deux mots d'un grand titre seulement : « qui tiennent *en production* ».
- `mono` — JetBrains Mono pour tout ce qui est technique : `fact`, `meta`, `status`, `code`, étiquettes, ports, horodatages.

**Mise en page.** 12 colonnes, `page-max` 1200px, gouttière `space-5`, marges `space-7` (ordinateur) et `space-4` (mobile). Sections espacées de `space-9` (ordinateur) ou `space-8` (mobile), ouvertes par « 01 / Domaines » en `meta` suivi d'un trait.

**Bordures, angles, ombres.** Filets `hairline` en `line` ; contrôles en `line-strong` (≥ 3:1). Angles droits partout (`radius-0`) sauf boutons, onglets et étiquettes (`radius-1`, 3px). Aucune ombre.

**Gabarits uniques.** Toutes les cartes de projet utilisent `ProjectCard`, toutes les colonnes de domaine `DomainColumn`, toutes les fiches de décision `DecisionRecord`.

**États et accessibilité.** Survol : `accent-hover`. Focus : contour 2px `accent`, décalé de 3px. Texte ≥ 4,5:1 dans les deux thèmes (`ink`, `ink-muted`, `ink-faint`, `accent`, `ok` vérifiés sur `ground`, `surface`, `surface-2`, `accent-soft`).

**Mouvement.** Discret, au service du propos « ce qui circule derrière l'écran », et coupé sous `prefers-reduced-motion: reduce` :
- des paquets de données (`d-packet`) parcourent les flux `accent` des schémas ; les flux asynchrones (SSE, sauvegarde) défilent en tirets ;
- les pastilles `ok` pulsent lentement (2,4 s) ; l'étape en cours de la frise aussi ;
- l'en-tête apparaît par couches (`pa-rise`, 0,7 s, décalages de 80 à 420 ms), les équerres du cartouche se tracent, les mots-liens de l'accroche se soulignent ;
- au survol : une carte monte de 3px et son contour passe en `accent`, la flèche d'un bouton avance de 3px, le soulignement d'un mot-lien s'épaissit, un logo passe en `accent`.
Jamais d'animation en boucle sur du texte, jamais de pluie de code ni de curseur de terminal.

## Illustrations

- Tirées du backend et de l'exploitation : schémas de systèmes (`SystemDiagram`) avec zones, services, bases en cylindre, ports et chemins ; mini-schémas de cartes ; lignes de supervision (`StatusLine`) ; fiches ADR.
- Pictogrammes des domaines en trait fin 1.5px, un détail en `accent`.
- Logos officiels des technologies (`TechIcons`, groupe d'assets « Icônes ») d'une seule encre, dans les étiquettes, les listes d'outils, les boîtes des schémas et la stack. Pas de logo en couleur de marque, pas de bandeau de logos.
- Photo dans un cartouche de plan (`Frame`), format modeste à côté de l'accroche.

## À éviter

Dégradés, effets de verre, emojis, barres de pourcentage, faux terminal avec invite de commande, pluie de code, carrousels de logos, cartes arrondies avec ombre portée.
