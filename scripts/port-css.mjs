// Porte docs/design/components/bundle.css vers styles/plan.css :
// - retire l'import Google Fonts (les polices viennent de next/font) ;
// - transforme la variante mobile `.pa-m …` de la maquette en requête média ;
// - ajoute un palier tablette, placé AVANT le palier mobile pour que le mobile l'emporte.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TABLETTE = `
@media (max-width: 1023px) {
  .pa-grid { grid-template-columns: 1fr 1fr; }
  .pa-feature { grid-template-columns: 1fr; }
  .pa-feature-text { border-right: 0; border-bottom: 1px solid var(--line); }
  .pa-domains { grid-template-columns: 1fr; }
  .pa-domain + .pa-domain { border-left: 0; border-top: 1px solid var(--line); }
  .pa-metaband { grid-template-columns: 1fr 1fr; }
  .pa-metaband > div { border-bottom: 1px solid var(--line); }
  .pa-cta h2 { font-size: 42px; line-height: 48px; }
}
`;

export function porterCss(source) {
  const lignes = source.split(/\r?\n/);
  const base = [];
  const mobile = [];
  for (const ligne of lignes) {
    if (ligne.startsWith("@import url(\"https://fonts.googleapis.com")) continue;
    if (ligne.startsWith(".pa-m ")) {
      mobile.push("  " + ligne.replaceAll(".pa-m ", ""));
      continue;
    }
    base.push(ligne);
  }
  return [
    "/* Fichier généré par scripts/port-css.mjs depuis docs/design/components/bundle.css — ne pas modifier à la main. */",
    base.join("\n").trim(),
    TABLETTE.trim(),
    "@media (max-width: 767px) {",
    ...mobile,
    "}",
    "",
  ].join("\n\n").replace(/\n\n  /g, "\n  ");
}

const estLanceDirectement = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (estLanceDirectement) {
  const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const source = readFileSync(path.join(racine, "docs/design/components/bundle.css"), "utf8");
  writeFileSync(path.join(racine, "styles/plan.css"), porterCss(source));
  console.log("styles/plan.css écrit");
}
