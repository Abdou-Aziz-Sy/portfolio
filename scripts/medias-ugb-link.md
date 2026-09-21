# Médias de l'étude de cas UGB Link

Sources : captures annotées et vidéos fournies par l'auteur (hors dépôt). Données affichées : démo.

## Captures (`public/projets/ugb-link/*.png`)

Copiées telles quelles, renommées. next/image les sert en AVIF/WebP : ne pas les convertir à la main.
Dimensions réelles à reporter dans `content/projets/ugb-link.mdx` (`largeur`, `hauteur`).

## Vidéo `parcours-candidature.mp4`

ffmpeg sans installation système : `npm i --prefix <dossier temporaire> ffmpeg-static`.

```bash
ffmpeg -i "Video Project 1.mp4" -an -vf "setpts=0.5*PTS,scale=1280:-2,fps=30" \
  -c:v libx264 -preset slow -crf 30 -profile:v high -pix_fmt yuv420p -movflags +faststart parcours-candidature.mp4
ffmpeg -ss 1.5 -i parcours-candidature.mp4 -frames:v 1 -q:v 4 parcours-candidature.jpg
```

Accélérée ×2 (84 s → 42 s), sans son, 1,4 Mo. Viser moins de 4 Mo par vidéo.

## Couverture `couverture.jpg` (pas encore affichée)

Image propre (sans annotations) tirée à 1 s de l'enregistrement du tableau de bord, 1280 px.
À activer par `couverture:` dans le frontmatter quand chaque projet aura la sienne : une seule
carte à photo décale les titres de la grille.
