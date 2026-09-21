# Régénérer le diagramme de classes de GamecupSN

`public/schemas/gamecupsn-domaine.svg` n'est pas dessiné à la main : il est **généré** depuis le
modèle de classes du dépôt GamecupSN, qui transcrit lui-même `docs/SPECIFICATIONS.md` §5. Le
régénérer après chaque évolution du modèle évite qu'il ne mente.

## Source

Dépôt GamecupSN, fichier `docs/uml/outils/generer_classes.py` : les dictionnaires `CLASSES`
(14 classes), `ENUMS` (9 énumérations) et `ASSOC` (27 associations). Ce même modèle produit le
`.drawio` du dépôt ; le SVG du portfolio en est une seconde sortie, adaptée à l'écran.

## Procédure

1. Écrire un script d'export qui importe ce fichier (il est protégé par `if __name__ ==
   "__main__"`, donc importable sans effet de bord), parcourt `CLASSES` et `ASSOC`, et émet du
   PlantUML : une classe par entrée, une association par tuple, la multiplicité de chaque côté,
   le libellé en étiquette, et un losange plein (`*--`) quand le style du modèle est une
   composition.
2. Rendre le PlantUML en SVG. PlantUML et Graphviz sont installés dans la WSL du poste :

   ```bash
   wsl -d ubuntu-22.04 -e bash -lc "python3 <script>.py && plantuml -tsvg /tmp/uml/gamecupsn-domaine.puml"
   ```

3. Copier le SVG obtenu dans `public/schemas/gamecupsn-domaine.svg`.

La sortie attendue du script est `classes: 14, enumerations: 9, associations: 27`. Si ces nombres
changent, le texte du dossier `content/projets/gamecupsn.mdx` les cite : il doit changer aussi.

## Deux variantes

Le script produit deux diagrammes : une **vue d'ensemble** (classes et associations, sans
attributs) et un **diagramme complet** (attributs et énumérations compris). Seule la vue
d'ensemble est publiée : à la largeur d'un écran, le diagramme complet fait 2 273 px de large et
son texte descend sous le seuil de lisibilité.

## Si le rendu automatique déçoit

Le placement de PlantUML croise parfois des traits. Une alternative acceptable : exporter le
`.drawio` du dépôt en SVG depuis draw.io (Fichier → Exporter → SVG), au prix d'un fichier figé,
qu'il faut penser à réexporter à chaque évolution du modèle. Le choix retenu aujourd'hui est la
génération, pour que le schéma ne puisse pas diverger du modèle.

## Diagrammes de cas d'utilisation (draw.io)

Source : `docs/sources/gamecupsn.drawio`, fichier de l'équipe (pages `Page-3` visiteur, `Page-4` abonné ;
`Page-5` est le diagramme de classes, déjà couvert par la génération PlantUML ci-dessus). Pour une
nouvelle version, remplacer le fichier (enregistré non compressé), puis :

```bash
node scripts/drawio-vers-svg.mjs docs/sources/gamecupsn.drawio Page-3 public/schemas/gamecupsn-cas-visiteur.svg
node scripts/drawio-vers-svg.mjs docs/sources/gamecupsn.drawio Page-4 public/schemas/gamecupsn-cas-abonne.svg
```

Le script reprend coordonnées et couleurs du fichier ; il échoue sur toute forme qu'il ne connaît pas.
Reporter les dimensions affichées dans `content/projets/gamecupsn.mdx` (`largeur`, `hauteur`).
