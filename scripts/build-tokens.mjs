// Génère styles/tokens.css à partir de docs/design/tokens.json (système « Plan d'architecte »).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELECTEURS = {
  dark: ':root, [data-theme="dark"]',
  light: '[data-theme="light"]',
};
const FAMILLES_FIXES = ["spacing", "radius", "layout"];

export function renderTokens(json) {
  const lignes = ["/* Fichier généré par scripts/build-tokens.mjs — ne pas modifier à la main. */", ""];

  for (const theme of json.color.themes) {
    const selecteur = SELECTEURS[theme.id];
    if (!selecteur) throw new Error(`Thème inconnu : ${theme.id}`);
    lignes.push(`${selecteur} {`);
    for (const jeton of json.color.tokens) {
      const valeur = typeof jeton.value === "string" ? jeton.value : jeton.value[theme.id];
      if (valeur) lignes.push(`  --${jeton.name}: ${valeur};`);
    }
    lignes.push("}", "");
  }

  lignes.push(":root {");
  for (const famille of FAMILLES_FIXES) {
    for (const jeton of json[famille]?.tokens ?? []) {
      lignes.push(`  --${jeton.name}: ${jeton.value};`);
    }
  }
  lignes.push("}", "");
  return lignes.join("\n");
}

const estLanceDirectement = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (estLanceDirectement) {
  const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const json = JSON.parse(readFileSync(path.join(racine, "docs/design/tokens.json"), "utf8"));
  writeFileSync(path.join(racine, "styles/tokens.css"), renderTokens(json));
  console.log("styles/tokens.css écrit");
}
