// Images de couverture des cartes de projet (champ `couverture` du frontmatter), en 1280 × 720.
// Un même format pour toutes : les titres des cartes restent alignés d'une carte à l'autre.
//
// Projets sans interface capturée : leur diagramme, placé dans le cadre sur le fond clair des
// schémas. GamecupSN : un recadrage du diagramme de classes sur son cœur (équipes, tournois,
// parties, matchs). Les captures d'application (UGB Link, mentorat) viennent d'ailleurs : image
// de la vidéo pour UGB Link (scripts/medias-ugb-link.md), scripts/captures/mentorat.mjs.
//   node scripts/couvertures.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

// sharp n'est pas une dépendance directe : c'est celle de Next, résolue depuis son paquet.
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");
mkdirSync("public/projets/couvertures", { recursive: true });

const L = 1280;
const H = 720;
const FOND = "#fbfcfd";

/** Diagramme entier, contenu dans le cadre avec une marge. */
async function contenir(source, sortie, marge = 48) {
  const image = await sharp(source, { density: 144 })
    .resize(L - 2 * marge, H - 2 * marge, { fit: "contain", background: FOND })
    .png()
    .toBuffer();
  await sharp({ create: { width: L, height: H, channels: 3, background: FOND } })
    .composite([{ input: image, left: marge, top: marge }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(sortie);
  console.log(sortie);
}

/** Zone du diagramme (coordonnées du SVG à l'échelle 1), recadrée au format 16:9. */
async function recadrer(source, sortie, zone) {
  await sharp(source, { density: 72 })
    .extract(zone)
    .resize(L, H, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(sortie);
  console.log(sortie);
}

await contenir("public/schemas/taskhandler-etats.svg", "public/projets/couvertures/taskhandler.jpg");
await contenir("public/schemas/gestion-stage-candidature.svg", "public/projets/couvertures/gestion-stage.jpg");
await recadrer("public/schemas/gamecupsn-classes.svg", "public/projets/couvertures/gamecupsn.jpg", {
  left: 600,
  top: 440,
  width: 1440,
  height: 810,
});
