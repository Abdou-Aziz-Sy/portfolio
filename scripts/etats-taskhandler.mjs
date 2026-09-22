// Diagramme d'états des tâches de taskhandler, dérivé du code source.
// Usage : node scripts/etats-taskhandler.mjs <chemin de TaskStatus.java> public/schemas/taskhandler-etats.svg
//
// Les transitions sont lues dans `getAllowedTransitions()` (dépôt noreyni03/taskhandler,
// src/main/java/com/example/taskmanager/model/TaskStatus.java). La disposition est fixée ici ;
// le script échoue si une transition du code n'a pas de tracé, ou si un tracé ne correspond à
// aucune transition : le schéma ne peut pas diverger du code sans que la génération casse.
import { readFileSync, writeFileSync } from "node:fs";

const [source, sortie] = process.argv.slice(2);
if (!sortie) throw new Error("usage : etats-taskhandler.mjs <TaskStatus.java> <sortie.svg>");
const java = readFileSync(source, "utf8");

const libelles = Object.fromEntries([...java.matchAll(/^\s*([A-Z_]+)\("([^"]+)"\)/gm)].map((m) => [m[1], m[2]]));
const transitions = [...java.matchAll(/case ([A-Z_]+) -> Set\.of\(([^)]*)\)/g)].flatMap((m) =>
  m[2].split(",").map((cible) => `${m[1]}>${cible.trim()}`),
);
if (Object.keys(libelles).length !== 5 || transitions.length === 0) throw new Error("TaskStatus.java : format inattendu");

// Boîtes : 160 × 56, flux principal sur une ligne, l'annulation en dessous.
const L = 160;
const H = 56;
const boites = { TODO: [40, 190], IN_PROGRESS: [290, 190], REVIEW: [540, 190], DONE: [790, 190], CANCELLED: [415, 370] };

// Tracés : chemin SVG de chaque transition (flèche à l'arrivée).
const traces = {
  "TODO>IN_PROGRESS": "M200 210 H290",
  "IN_PROGRESS>TODO": "M290 230 H200",
  "IN_PROGRESS>REVIEW": "M450 210 H540",
  "REVIEW>IN_PROGRESS": "M540 230 H450",
  "REVIEW>DONE": "M700 218 H790",
  "IN_PROGRESS>DONE": "M390 190 C390 120 850 120 850 190",
  "DONE>IN_PROGRESS": "M890 190 C890 50 350 50 350 190",
  "TODO>CANCELLED": "M150 246 L440 370",
  "CANCELLED>TODO": "M415 398 C230 398 100 330 100 246",
  "IN_PROGRESS>CANCELLED": "M370 246 L470 370",
  "REVIEW>CANCELLED": "M620 246 L545 370",
};
const manquants = transitions.filter((t) => !traces[t]);
const orphelins = Object.keys(traces).filter((t) => !transitions.includes(t));
if (manquants.length || orphelins.length) throw new Error(`schéma ≠ code — sans tracé : ${manquants}, sans transition : ${orphelins}`);

const POLICE = 'font-family="Helvetica, Arial, sans-serif"';
const LARGEUR = 1000;
const HAUTEUR = 520;
const noeuds = Object.entries(boites)
  .map(([code, [x, y]]) => {
    const annule = code === "CANCELLED";
    return `<rect x="${x}" y="${y}" width="${L}" height="${H}" rx="10" fill="${annule ? "#F5F5F5" : "#E8F1FB"}" stroke="${annule ? "#616E7C" : "#1F6FB2"}" stroke-width="1.5"/>
<text x="${x + L / 2}" y="${y + 24}" text-anchor="middle" font-size="15" font-weight="bold" fill="#10202F" ${POLICE}>${libelles[code]}</text>
<text x="${x + L / 2}" y="${y + 43}" text-anchor="middle" font-size="11" fill="#52606D" font-family="Consolas, monospace">${code}</text>`;
  })
  .join("\n");
const fleches = transitions.map((t) => `<path d="${traces[t]}" fill="none" stroke="#1F2933" stroke-width="1.4" marker-end="url(#pointe)"/>`).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGEUR} ${HAUTEUR}" width="${LARGEUR}" height="${HAUTEUR}">
<defs><marker id="pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#1F2933"/></marker></defs>
<rect width="${LARGEUR}" height="${HAUTEUR}" fill="#fbfcfd"/>
<text x="${LARGEUR / 2}" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#10202F" ${POLICE}>taskhandler — cycle de vie d'une tâche (TaskStatus.getAllowedTransitions)</text>
${fleches}
${noeuds}
<text x="${LARGEUR / 2 + 120}" y="76" text-anchor="middle" font-size="12" fill="#52606D" ${POLICE}>rouvrir une tâche terminée</text>
<rect x="40" y="450" width="920" height="56" rx="6" fill="#FFF8E1" stroke="#C8A415"/>
<text x="56" y="473" font-size="13" fill="#1F2933" ${POLICE}>Toute autre transition est refusée : InvalidStatusTransitionException, rendue en 400 par le gestionnaire global.</text>
<text x="56" y="494" font-size="13" fill="#1F2933" ${POLICE}>Chaque transition acceptée crée une ligne de TaskStatusHistory : ancien et nouveau statut, auteur, date, commentaire.</text>
</svg>
`;
writeFileSync(sortie, svg);
console.log(`${sortie} : ${transitions.length} transitions`);
