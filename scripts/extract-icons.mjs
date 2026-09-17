// Extrait les logos Simple Icons (CC0) définis dans les planches de la maquette vers public/icons.svg.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dossier = path.join(racine, "docs/design/components");
const symboles = new Map();

for (const nom of readdirSync(dossier)) {
  if (!nom.startsWith("Planche-")) continue;
  const html = readFileSync(path.join(dossier, nom, "preview.html"), "utf8");
  for (const m of html.matchAll(/<symbol id="si-([a-z]+)"[^>]*>[\s\S]*?<\/symbol>/g)) {
    if (!symboles.has(m[1])) symboles.set(m[1], m[0]);
  }
}

const cles = [...symboles.keys()].sort();
writeFileSync(
  path.join(racine, "public/icons.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg">\n${cles.map((c) => symboles.get(c)).join("\n")}\n</svg>\n`,
);
console.log(`${cles.length} symboles : ${cles.join(", ")}`);
