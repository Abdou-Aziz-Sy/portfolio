# Chantier 4 — Contenu : cinq dossiers, cinq preuves

Date : 20 septembre 2026. Branche : `feat/contenu-projets`. Prérequis : chantiers 1 à 3 livrés et en production.

## Objectif

Aujourd'hui, un recruteur trouve une étude de cas complète (UGB Link) et trois dossiers minces qui ne prouvent rien. L'audit notait 6/10 sur les études de cas, faute de preuves.

Après ce chantier, le portfolio présente **cinq dossiers, chacun prouvant une compétence différente**, tous documentés au même niveau. Le positionnement visé : un ingénieur qui **conçoit avant de coder** — architecture, modélisation, décisions écrites — et qui sait mettre en production.

## A. Les cinq dossiers

PlusUtra est retiré du site (projet écrit sous assistance, non défendable en entretien) : son fichier MDX est supprimé, son numéro de dossier libéré, les dossiers renumérotés.

| Dossier | Projet | Ce qu'il prouve |
|---|---|---|
| 01 | UGB Link | Mettre en production et exploiter un système réel |
| 02 | GamecupSN | Concevoir et modéliser avant de coder |
| 03 | taskhandler | Java / Spring Boot : un cycle de vie métier validé |
| 04 | Gestion_Stage | Une API Node complète, de la base aux routes |
| 05 | Hackathon Musée des Civilisations Noires | Livrer vite sous contrainte |

### GamecupSN — la vitrine génie logiciel

Le dossier change de nature : ce n'est plus « une plateforme e-sport en cours », c'est **la conception d'un système**. Éléments vérifiés dans le dépôt local (`docs/uml/`, `docs/SPECIFICATIONS.md`, `DECISIONS.md`) :

- 7 diagrammes de cas d'usage, un par acteur, plus un diagramme dédié aux cas émis par le système — découpage justifié : sept cas n'ont aucun acteur humain déclencheur ;
- un diagramme de classes : 14 classes, 9 énumérations, 27 associations ;
- 105 user stories, couverture 105/105, vérifiée en comparant les identifiants des cas à ceux de la spécification ;
- le diagramme de classes est **généré** depuis un modèle Python qui transcrit la spécification ; un script en vérifie la cohérence ;
- des décisions numérotées et datées, tenues à jour pendant la conception.

La section « Résultats » dit où en est réellement le projet (conception achevée, squelette applicatif et intégration continue en place), sans laisser croire à un produit livré.

### taskhandler — Java / Spring Boot

Application de gestion de tâches (Spring Boot + React), menée à quatre. Contribution de l'auteur vérifiée commit par commit (20 commits, deuxième contributeur) :

- fondation données : configuration PostgreSQL, entité `User`, repository ;
- réinitialisation de mot de passe : génération de jeton, notification par e-mail, migration SQL ;
- création et mise à jour de tâches, avec validation ;
- gestion globale des erreurs (`GlobalExceptionHandler`) et réponses de validation normalisées ;
- cycle de vie des tâches : transitions de statut validées et **historisées** (`TaskStatusHistory`, `InvalidStatusTransitionException`).

**Ne jamais revendiquer** : l'authentification JWT, la chaîne d'intégration continue et l'intégration finale, écrites par d'autres contributeurs. Le dossier nomme explicitement le périmètre de l'auteur.

### Gestion_Stage — une API complète

Plateforme de gestion de stages (Node.js, Express, MongoDB/Mongoose, JWT, dépôt de fichiers par Multer). Contribution vérifiée par les fichiers touchés : modèles, contrôleurs, routes, serveur, connexion à la base, téléversement de documents — soit l'essentiel du backend.

**Pré-requis bloquant** : le dépôt public contient un fichier `.env` commité avec l'URI MongoDB et le secret JWT. Tant que ces secrets ne sont pas changés et le fichier retiré, le portfolio ne publie aucun lien vers ce dépôt.

### Hackathon et UGB Link

Le hackathon gagne le récit qui lui manque : durée, équipe, rôle de l'auteur, résultat. UGB Link est inchangé, sauf la renumérotation.

## B. Le gabarit commun

Les cinq études suivent la structure d'UGB Link : **Contexte → Contraintes → Architecture → Décisions → Résultats → Ce que je referais autrement**. Chaque dossier porte un mini-schéma cohérent avec son architecture réelle.

Règles de contenu, héritées du projet :

1. Aucun chiffre invérifiable. Une section « Résultats » sans résultat dit où en est le projet.
2. Aucune revendication sur du travail fait par quelqu'un d'autre ; les projets d'équipe nomment le périmètre de l'auteur et la taille de l'équipe.
3. Toute affirmation technique se vérifie dans le dépôt du projet avant publication.
4. Aucun lien vers un dépôt dont les secrets sont exposés.

## C. Montrer l'UML

Sur la page GamecupSN, les diagrammes sont affichés en **SVG versionnés dans le dépôt du portfolio**, pas en captures d'écran : le diagramme de classes est régénéré depuis le modèle Python du projet source, et exporté en SVG. Au minimum le diagramme de classes ; les diagrammes de cas d'usage suivent si leur export est lisible à l'écran.

Contraintes d'affichage, identiques au schéma d'UGB Link : lisible dès 320 px (cadre défilant avec indice), texte d'au moins 11 px, description accessible, aucun contenu réservé au survol.

## D. Corrections d'interface

1. **Contact.** Le bandeau affiche l'adresse e-mail et le bouton « Copier » au même niveau que le bouton principal, pour qu'un clic sur un lien `mailto:` sans client de messagerie ne tombe plus dans le vide. Le bouton de l'en-tête conserve son ancre.
2. **Portrait.** La photo fournie remplace les initiales du cartouche, sur l'accueil et sur « à propos ».
3. **Grand écran.** À 2560 px, la première vue est très vide : le haut de page ne fait que 485 px de haut pour 1440 px de fenêtre. Les espacements et la taille du cartouche sont revus pour que la première vue porte le titre, l'action principale, les chiffres clés et le portrait.

## E. Hors périmètre

Formulaire de contact avec service tiers, refonte graphique, publication du blog, recommandations, captures d'UGB Link, nouvelles animations.

## Vérification

- Chaîne complète verte : lint, types, tests unitaires, build, tests de bout en bout, puis CI GitHub avant toute fusion.
- Un test vérifie qu'aucun dossier publié n'a de section « Résultats » vide et que chaque dossier d'équipe nomme sa taille d'équipe.
- Lighthouse mobile en production (PageSpeed) : accessibilité, bonnes pratiques et SEO à 100, performance ≥ 95, CLS à 0 — niveau actuel à ne pas dégrader.
- Revue visuelle à 375, 1024, 1440 et 2560 px, en clair et en sombre.

## Critères de réussite

- Cinq dossiers, cinq compétences distinctes, tous au niveau de détail d'UGB Link.
- Un recruteur qui ouvre GamecupSN voit une modélisation UML réelle et des décisions datées.
- Aucune affirmation du site ne dépasse ce que les dépôts prouvent.
