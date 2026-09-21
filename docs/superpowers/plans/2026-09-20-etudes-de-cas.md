# Chantier 4b — Cinq études de cas : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS : utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Goal :** porter les cinq dossiers du portfolio au niveau de détail d'UGB Link, chacun prouvant une compétence différente, et montrer la modélisation UML de GamecupSN comme une preuve.

**Architecture :** les trois nouveaux dossiers sont d'abord écrits en brouillon (`publie: false`), ce qui les tient hors du site et laisse les compteurs de tests inchangés pendant leur rédaction ; une tâche finale les publie, retire le hackathon et met les tests à jour d'un seul coup. Les diagrammes UML sont des SVG versionnés, régénérés depuis le modèle Python du dépôt GamecupSN.

**Tech Stack :** MDX validé par Zod (`lib/schemas.ts`), composants MDX existants (`Prose`, `Liste`, `Contexte`, `DecisionRecord`, `Exploitation`, `Figure`, `Callout`), Next.js 16, Playwright, PlantUML (dans la WSL).

## Global Constraints

- Spec : `docs/superpowers/specs/2026-09-20-contenu-projets-design.md`.
- **Véracité** : aucune affirmation qui ne soit vérifiable dans le dépôt du projet. Aucun chiffre inventé. Les projets d'équipe nomment la taille de l'équipe et le périmètre de l'auteur. Une section « Résultats » sans résultat dit où en est le projet.
- **Interdits explicites** : ne jamais attribuer à l'auteur l'authentification JWT, la CI/CD ni l'intégration finale de taskhandler ; ne publier aucun lien vers `mamadoujuniorsy/Gestion_Stage` tant que le `.env` commité (URI MongoDB, secret JWT) n'est pas révoqué ; ne publier aucun lien vers le dépôt GitLab de la plateforme de mentorat tant qu'il est privé.
- Code, libellés, commentaires et commits en français. Cycle TDD ; chaque test doit pouvoir échouer.
- Avant `pnpm build` ou `pnpm test:e2e` : aucun serveur sur les ports 3000, 3001, 3100.
- Ne jamais fusionner sans CI verte (Chromium/Linux), les e2e locaux tournant sous Edge/Windows.
- Frontmatter obligatoire (voir `lib/schemas.ts`) : `titre`, `accroche`, `resume`, `dossier`, `annee`, `statut`, `cadre`, `categories`, `stack`, `miniSchema` (exactement trois boîtes), `publie`. Facultatifs utiles : `role`, `periode`, `stackDetail`, `depot`, `demo`, `misEnAvant`.
- Valeurs autorisées : `statut` ∈ {`en-production`, `en-cours`, `termine`} ; `categories` ⊂ {`backend`, `full-stack`, `infrastructure`, `ia`} ; `stack` ⊂ clés de `lib/icons.ts`.

## Fichiers

- Créer : `content/projets/mentorat-vcn.mdx`, `content/projets/taskhandler.mdx`, `content/projets/gestion-stage.mdx`, `public/schemas/gamecupsn-domaine.svg`, `scripts/uml-gamecupsn.md`.
- Modifier : `content/projets/gamecupsn.mdx`, `content/projets/ugb-link.mdx` (numérotation seule), `tests/e2e/projets.spec.ts`, `tests/e2e/liens.spec.ts`, `tests/e2e/navigation.spec.ts`, `tests/unit/content.test.ts`.
- Supprimer : `content/projets/hackathon-mcn.mdx`.

---

### Task 1 : Le diagramme de classes de GamecupSN, en SVG régénérable

**Files:**
- Create: `public/schemas/gamecupsn-domaine.svg`, `scripts/uml-gamecupsn.md`
- Test: `tests/e2e/projets.spec.ts`

**Interfaces:**
- Produces : `public/schemas/gamecupsn-domaine.svg`, affiché par la tâche 2 dans `content/projets/gamecupsn.mdx`.

- [ ] **Step 1: Générer le SVG depuis le modèle du dépôt GamecupSN**

Le modèle de classes vit dans `docs/uml/outils/generer_classes.py` du dépôt GamecupSN (`\\wsl.localhost\ubuntu-22.04\home\workspace\projects\gamecupsn`) : `CLASSES` (14), `ENUMS` (9), `ASSOC` (27). Le script d'export, déjà écrit et vérifié pendant la conception, produit deux PlantUML puis les rend en SVG :

```bash
wsl -d ubuntu-22.04 -e bash -lc "mkdir -p /tmp/uml && python3 '<chemin du script vers_plantuml.py>' && plantuml -tsvg /tmp/uml/gamecupsn-domaine.puml"
mkdir -p public/schemas
cp "//wsl.localhost/ubuntu-22.04/tmp/uml/gamecupsn-domaine.svg" public/schemas/gamecupsn-domaine.svg
```

Attendu : `classes: 14, enumerations: 9, associations: 27`.

- [ ] **Step 2: Consigner la procédure**

`scripts/uml-gamecupsn.md` : d'où vient le SVG, quelle commande le régénère, quel commit du dépôt GamecupSN il reflète. Un lecteur doit pouvoir le refaire sans deviner.

- [ ] **Step 3: Vérifier le rendu**

Convertir en PNG et regarder : les 14 classes doivent être nommées lisiblement, les multiplicités visibles, aucune étiquette détachée de son trait au point d'être ambiguë. Si le rendu automatique reste confus, préférer un export SVG fait depuis draw.io par l'auteur et le noter dans `scripts/uml-gamecupsn.md`.

- [ ] **Step 4: Commit**

```bash
git add public/schemas/gamecupsn-domaine.svg scripts/uml-gamecupsn.md
git commit -m "feat(gamecupsn): diagramme de classes en SVG, régénérable depuis le modèle"
```

---

### Task 2 : Dossier 02 — GamecupSN, la conception comme preuve

**Files:**
- Modify: `content/projets/gamecupsn.mdx`
- Test: `tests/e2e/projets.spec.ts`

**Interfaces:**
- Consumes : `public/schemas/gamecupsn-domaine.svg` (tâche 1).

- [ ] **Step 1: Écrire le test qui échoue**

Dans `tests/e2e/projets.spec.ts` :

```ts
test("le dossier GamecupSN montre la modélisation", async ({ page }) => {
  await page.goto("/projets/gamecupsn");
  await expect(page.getByRole("heading", { name: /Modélisation/ })).toBeVisible();
  const schema = page.locator('img[src*="gamecupsn-domaine"], object[data*="gamecupsn-domaine"]');
  await expect(schema).toHaveCount(1);
  // Les chiffres du dépôt, pas des ordres de grandeur.
  await expect(page.locator("main")).toContainText("105");
  await expect(page.locator("main")).toContainText("27 associations");
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/projets.spec.ts -g "GamecupSN montre" --project=chromium --reporter=line
```

Attendu : ÉCHEC — la section « Modélisation » n'existe pas.

- [ ] **Step 3: Réécrire le dossier**

Frontmatter : garder `dossier: 2`, `statut: en-cours`, `cadre: En équipe de trois`, ajouter `role: "Architecture backend, modélisation et DevOps"` et `periode: "2026 — en cours"`.

Sections, dans l'ordre du gabarit, à composer **uniquement** à partir des faits vérifiés ci-dessous :

- **Contexte** — plateforme de tournois e-sport pour la scène sénégalaise ; équipe de trois ; l'auteur porte l'architecture backend, la modélisation et le DevOps.
- **Contraintes** — reprendre les contraintes réelles du dépôt (`docs/SPECIFICATIONS.md` §1) sans en inventer.
- **Modélisation** (section neuve, cœur du dossier) — 7 diagrammes de cas d'usage, un par acteur, plus un huitième pour les cas émis par le système : sept cas n'ont aucun acteur humain déclencheur, un découpage strictement par acteur les aurait perdus. Diagramme de classes : 14 classes, 9 énumérations, 27 associations. 105 user stories, couverture 105/105 vérifiée en comparant les identifiants des cas à ceux de la spécification. Le diagramme de classes est **généré** depuis un modèle qui transcrit la spécification, et un script vérifie leur cohérence : le schéma ne peut pas diverger du texte. Afficher le SVG via `<Figure>`.
- **Décisions** — reprendre deux ou trois décisions réelles de `DECISIONS.md`, avec leur numéro (ex. décision 2 : l'identité ne connaît aucun jeu ; ajouter un jeu est une ligne en base, sans migration).
- **Résultats** — dire l'état réel : conception achevée, squelette applicatif et intégration continue en place, développement en cours. Aucun chiffre d'usage.
- **Ce que je referais autrement** — un constat honnête tiré de la conduite du projet.

- [ ] **Step 4: Vérifier**

```bash
pnpm exec playwright test tests/e2e/projets.spec.ts --project=chromium --reporter=line
```

- [ ] **Step 5: Revue visuelle du schéma à trois largeurs**

```bash
bash .work/serve.sh
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/projets/gamecupsn ".pa-fig" .work/c4b-uml-1440.png 1440 dark
MSYS_NO_PATHCONV=1 node .work/el.mjs http://localhost:3001/projets/gamecupsn ".pa-fig" .work/c4b-uml-375.png 375 dark
```

Le diagramme doit rester lisible ou défiler dans son cadre, jamais déborder.

- [ ] **Step 6: Commit**

```bash
git add content/projets/gamecupsn.mdx tests/e2e/projets.spec.ts
git commit -m "feat(gamecupsn): le dossier montre la modélisation du domaine"
```

---

### Task 3 : Dossier 03 — Plateforme de mentorat (VCN 2025), en brouillon

**Files:**
- Create: `content/projets/mentorat-vcn.mdx`

**Interfaces:**
- Produces : un dossier `publie: false`, publié en tâche 6.

- [ ] **Step 1: Écrire le frontmatter**

```yaml
---
titre: Plateforme de mentorat
accroche: Une plateforme de mentorat pair-à-pair pour les étudiants
resume: Mise en relation étudiants-mentors, sessions planifiées, messagerie instantanée et visioconférence.
dossier: 3
annee: 2025
statut: termine
cadre: Vacances Citoyennes Numériques, équipe de trois
categories: [backend, full-stack, infrastructure]
stack: [nodedotjs, express, postgresql, docker]
role: Contributeur principal, backend et infrastructure
periode: Septembre — octobre 2025
stackDetail: Node.js · Express 5 · Prisma · PostgreSQL · Redis · Socket.io · Docker Compose
miniSchema:
  - { titre: Web, sous: React }
  - { titre: API, sous: Express · Socket.io }
  - { titre: PostgreSQL, sous: Prisma }
publie: false
---
```

- [ ] **Step 2: Composer les sections à partir des faits vérifiés**

- **Contexte** — Vacances Citoyennes Numériques, première édition, organisées par l'Université numérique Cheikh Hamidou Kane dans le cadre du New Deal Technologique : trois semaines de formation en équipes interdisciplinaires, avec prix aux meilleures solutions. Besoin visé : l'accompagnement individuel des étudiants. Équipe de trois, 56 commits de l'auteur sur 94, du 23 septembre au 28 octobre 2025.
- **Contraintes** — périmètre MVP fixé par le cahier de lancement : inscription, profils, mise en relation simple, réservation de sessions, messagerie, visioconférence un-à-un, partage de ressources, tableau de bord d'administration.
- **Architecture** — backend Express 5 et Prisma 6 sur PostgreSQL, 20 modèles avec migrations et jeux de données de démonstration ; Socket.io pour la messagerie et les notifications ; BigBlueButton pour la visioconférence, avec repli Jitsi ; API documentée par Swagger ; Helmet, limitation de débit, validation par Joi et express-validator ; Docker Compose pour PostgreSQL 15, Redis 7 et MailHog.
- **Décisions** — deux ou trois décisions réelles et défendables, par exemple : séparer disponibilités récurrentes et créneaux ponctuels ; garder un repli Jitsi quand BigBlueButton n'est pas joignable ; poser le temps réel sur Socket.io plutôt que sur du sondage.
- **Résultats** — dire l'état réel du dépôt : MVP fonctionnel sur les domaines cités, plan de finalisation écrit (chat en session, interface des campagnes, matching, tests d'intégration). **Ne rien affirmer sur un prix, une incubation ou une mise en ligne sans confirmation de l'auteur.**
- **Ce que je referais autrement** — un constat honnête (par exemple sur le découpage des branches ou la dette de tests).

Aucun `depot` ni `demo` tant que le dépôt GitLab est privé.

- [ ] **Step 3: Vérifier le rendu en brouillon**

```bash
AFFICHER_BROUILLONS=1 pnpm build && AFFICHER_BROUILLONS=1 pnpm start -p 3001
```

Ouvrir `http://localhost:3001/projets/mentorat-vcn` : le frontmatter doit passer la validation Zod (sinon le build échoue en citant le fichier) et le sommaire doit lister toutes les sections.

- [ ] **Step 4: Commit**

```bash
git add content/projets/mentorat-vcn.mdx
git commit -m "feat(contenu): dossier de la plateforme de mentorat, en brouillon"
```

---

### Task 4 : Dossier 04 — taskhandler, en brouillon

**Files:**
- Create: `content/projets/taskhandler.mdx`

- [ ] **Step 1: Écrire le frontmatter**

```yaml
---
titre: taskhandler
accroche: Le cycle de vie des tâches d'une application de gestion d'équipe
resume: Application de gestion de tâches en Spring Boot et React, menée à quatre en cours de génie logiciel.
dossier: 4
annee: 2025
statut: termine
cadre: Cours de génie logiciel, master 1, équipe de quatre
categories: [backend]
stack: [postgresql]
role: Backend, domaine des tâches
periode: Avril — juin 2025
stackDetail: Java · Spring Boot · Spring Data JPA · PostgreSQL · React
miniSchema:
  - { titre: React, sous: interface }
  - { titre: Spring Boot, sous: API REST }
  - { titre: PostgreSQL, sous: tâches }
depot: https://github.com/noreyni03/taskhandler
publie: false
---
```

Si aucune icône ne correspond à Java ou Spring dans `lib/icons.ts`, laisser `stack: [postgresql]` et détailler la pile dans `stackDetail` — ne jamais inventer une clé d'icône, le build échouerait.

- [ ] **Step 2: Composer les sections à partir des faits vérifiés**

- **Contexte** — cours de génie logiciel de master 1, second semestre : mener un projet de bout en bout avec les méthodes et outils du génie logiciel. Équipe de quatre. L'auteur est le deuxième contributeur (20 commits) et tient le domaine des tâches.
- **Contraintes** — travail à quatre sur un même dépôt, avec branches par fonctionnalité et revues croisées.
- **Architecture** — Spring Boot découpé en contrôleurs, services, dépôts, DTO et gestion d'erreurs ; PostgreSQL ; migrations SQL ; React côté interface.
- **Décisions** — la décision structurante de l'auteur : **historiser les changements de statut** (`TaskStatusHistory`) au lieu de ne garder que l'état courant, et refuser les transitions invalides par une exception dédiée (`InvalidStatusTransitionException`) plutôt que de laisser passer n'importe quel changement. Deuxième décision : normaliser les erreurs de validation dans un `GlobalExceptionHandler` pour que l'interface reçoive toujours la même forme de réponse.
- **Périmètre** — dire clairement ce que l'auteur a écrit : fondation données (configuration PostgreSQL, entité `User`, repository), réinitialisation de mot de passe par jeton avec notification par e-mail, création et mise à jour de tâches avec validation, gestion globale des erreurs, cycle de vie des statuts. Et ce qu'il n'a pas écrit : l'authentification JWT, la chaîne d'intégration continue, l'intégration finale.
- **Résultats** — état réel du projet ; **demander à l'auteur** avant d'évoquer une soutenance ou une note.
- **Ce que je referais autrement**.

- [ ] **Step 3: Vérifier et commiter**

```bash
AFFICHER_BROUILLONS=1 pnpm build
git add content/projets/taskhandler.mdx
git commit -m "feat(contenu): dossier taskhandler, en brouillon"
```

---

### Task 5 : Dossier 05 — Gestion_Stage, en brouillon

**Files:**
- Create: `content/projets/gestion-stage.mdx`

- [ ] **Step 1: Écrire le frontmatter**

```yaml
---
titre: Gestion de stages
accroche: L'API d'une plateforme de gestion des stages
resume: Backend complet d'une plateforme de candidatures et de suivi de stages, écrit en cours de conception d'interface.
dossier: 5
annee: 2024
statut: termine
cadre: Cours de conception d'interface, licence 3, équipe de trois
categories: [backend]
stack: [nodedotjs, express]
role: Backend
periode: Mai — juin 2024
stackDetail: Node.js · Express · MongoDB · Mongoose · JWT · Multer
miniSchema:
  - { titre: Client, sous: maquette Figma }
  - { titre: API, sous: Express }
  - { titre: MongoDB, sous: candidatures }
publie: false
---
```

Aucun `depot` : le dépôt expose un `.env` commité.

- [ ] **Step 2: Composer les sections à partir des faits vérifiés**

- **Contexte** — cours de conception d'interface en licence 3 : produire une maquette Figma puis la coder, à trois. L'auteur a pris tout le backend.
- **Architecture** — Express découpé en modèles, contrôleurs et routes ; MongoDB via Mongoose ; authentification JWT ; téléversement de documents de candidature par Multer.
- **Décisions** — décisions réelles lisibles dans le code (par exemple le découpage par domaine : authentification, utilisateurs, candidats, stages).
- **Résultats** — état réel ; **demander à l'auteur** avant d'évoquer une note ou une soutenance.
- **Ce que je referais autrement** — un constat honnête, où l'auteur peut évoquer ce qu'il a appris depuis : des messages de commit lisibles, et surtout **ne jamais commiter un fichier de secrets** — le `.env` du dépôt expose encore une URI MongoDB et un secret JWT.

- [ ] **Step 3: Vérifier et commiter**

```bash
AFFICHER_BROUILLONS=1 pnpm build
git add content/projets/gestion-stage.mdx
git commit -m "feat(contenu): dossier de gestion de stages, en brouillon"
```

---

### Task 6 : Publier les trois dossiers, retirer le hackathon, mettre les tests à jour

**Files:**
- Delete: `content/projets/hackathon-mcn.mdx`
- Modify: les trois nouveaux MDX (`publie: true`), `tests/e2e/projets.spec.ts`, `tests/e2e/liens.spec.ts`, `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Mettre les tests à jour d'abord**

Cinq dossiers publiés après cette tâche : ugb-link (1), gamecupsn (2), mentorat-vcn (3), taskhandler (4), gestion-stage (5).

`tests/e2e/projets.spec.ts` : `toHaveCount(3)` → `toHaveCount(5)`, `"3 dossiers"` → `"5 dossiers"`. Le filtre « Backend » couvre ugb-link, gamecupsn, mentorat-vcn, taskhandler et gestion-stage : recompter à partir des `categories` réellement écrites, ne pas deviner. Le filtre « Full stack » couvre gamecupsn et mentorat-vcn. Le test « une étude de cas mène au dossier suivant » suit la numérotation.

`tests/e2e/liens.spec.ts` : remplacer `/projets/hackathon-mcn` par les trois nouveaux chemins dans `PAGES_TEST`.

`tests/e2e/navigation.spec.ts` : mettre à jour la liste `PAGES` si elle cite le hackathon.

- [ ] **Step 2: Lancer et vérifier l'échec**

```bash
pnpm exec playwright test tests/e2e/projets.spec.ts --project=chromium --reporter=line
```

Attendu : ÉCHEC — trois cartes au lieu de cinq.

- [ ] **Step 3: Publier et retirer**

Passer `publie: true` dans les trois nouveaux MDX, puis :

```bash
git rm content/projets/hackathon-mcn.mdx
```

- [ ] **Step 4: Chaîne complète**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test --reporter=line
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(contenu): publie les trois nouveaux dossiers et retire le hackathon"
```

---

### Task 7 : Vérification finale et fusion

- [ ] Revue visuelle des cinq dossiers à 375, 1024 et 1440 px, en clair et en sombre.
- [ ] Relecture de véracité : reprendre chaque affirmation de chaque dossier et pointer la preuve dans le dépôt correspondant. Toute phrase sans preuve est retirée.
- [ ] Pousser, ouvrir la pull request, attendre la CI verte, fusionner.
- [ ] Après déploiement : PageSpeed mobile sur `/projets` et un nouveau dossier — accessibilité, bonnes pratiques et SEO à 100, performance ≥ 95, CLS à 0.

## Self-Review

- **Couverture de la spec** : §A (cinq dossiers, retrait du hackathon) → tâches 2 à 6 ; §B (gabarit commun) → chaque tâche de contenu ; §C (UML) → tâches 1 et 2 ; §Vérification → tâche 7. Le §D (interface) a été livré par le chantier 4a.
- **Aucun espace réservé** : chaque tâche porte son frontmatter exact et la liste des faits vérifiés à partir desquels composer. Les trois points qui manquent encore (résultat de chaque projet) sont explicitement marqués « demander à l'auteur » plutôt que devinés.
- **Cohérence des noms** : slugs `mentorat-vcn`, `taskhandler`, `gestion-stage` ; numéros 1 à 5 sans trou ; `public/schemas/gamecupsn-domaine.svg` utilisé à l'identique en tâches 1 et 2.
- **Vérifié contre le code réel** : `lib/schemas.ts` impose bien `miniSchema` à trois boîtes et un `statut` parmi trois valeurs ; `lib/content.ts` filtre sur `publie` sauf si `AFFICHER_BROUILLONS=1` ; `tests/e2e/projets.spec.ts` attend aujourd'hui 3 cartes et « 3 dossiers ».
