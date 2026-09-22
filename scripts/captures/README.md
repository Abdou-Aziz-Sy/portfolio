# Captures annotées des études de cas

`annoter.mjs` pose des cadres et des étiquettes dans la page juste avant la prise de vue, dans le
style des captures annotées à la main d'UGB Link (cadre vert, texte sombre). Un script par projet
lance l'application en local, s'y connecte et produit ses images dans `public/projets/<projet>/`.

## Plateforme de mentorat (`mentorat.mjs`)

Sources : `Documents\Projects\Pro\monitoring_platforme1.0\monitiring_platforme`. Toutes les données
affichées sont celles du jeu de démonstration du projet (comptes fictifs, mot de passe `password123`).

1. **Base** : le `.env` du backend vise le PostgreSQL local (port 5432). Créer une base à part, y
   appliquer le schéma et la peupler (`db push` a servi pour ces captures ; `migrate deploy` crée
   les mêmes vingt tables) :
   ```bash
   psql "<DATABASE_URL sans le nom de base>/postgres" -c "create database mentoring_db;"
   cd backend && npx prisma db push && node seed-database.js
   ```
   Docker n'est pas nécessaire ; Redis n'est utilisé nulle part dans le code.
2. **Serveurs** : le port 5000 est pris par un service Windows, d'où l'API sur 5050.
   ```bash
   cd backend && PORT=5050 node src/server.js
   cd frontend && BROWSER=none REACT_APP_API_URL=http://localhost:5050/api REACT_APP_SOCKET_URL=http://localhost:5050 npx react-scripts start
   ```
3. **Données propres aux captures**, créées une fois par l'interface (le script ne les recrée pas) :
   - mentor `abdou.sow@mentor.pro.sn` : disponibilités récurrentes mardi et jeudi 18 h – 20 h,
     samedi 10 h – 12 h ; créneaux spécifiques le 26/09/2026 14 h – 16 h (« Revue de CV avant les
     candidatures ») et le 03/10/2026 9 h – 11 h (« Préparation aux entretiens techniques »).
     **Remplir la note** : vide, l'interface envoie `null` et l'API répond 400.
   - étudiant `abdou.sy@student.edu.sn` : conversation ouverte avec le mentor ci-dessus (par son
     e-mail), un message chacun.
4. `node scripts/captures/mentorat.mjs` depuis la racine du portfolio.

Constats faits en préparant les captures, non corrigés (le projet est un premier jet) : l'envoi
d'un message passe par l'API REST, qui n'émet pas `new_message` — le destinataire ne le voit
qu'en rechargeant ; la recherche de mentors ne renvoie rien sur le jeu de démonstration ;
plusieurs écrans (tableau de bord du mentor, rendez-vous, sessions de l'étudiant) affichent une
erreur de chargement.
