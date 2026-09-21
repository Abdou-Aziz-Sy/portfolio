// Convertit une page d'un fichier draw.io (non compressé) en SVG autonome, pour le site.
// Usage : node scripts/drawio-vers-svg.mjs <fichier.drawio> <nom de la page> <sortie.svg>
//
// Couvre ce qu'emploient les diagrammes de cas d'utilisation : cadre du système, ellipses,
// acteurs, notes, arêtes droites (association, «include»/«extend», généralisation). Les
// coordonnées et couleurs sont celles du fichier : le SVG est une transcription, pas un
// redessin. Toute forme inconnue fait échouer le script plutôt que de disparaître en silence.
import { readFileSync, writeFileSync } from "node:fs";

const [fichier, nomPage, sortie] = process.argv.slice(2);
if (!sortie) throw new Error("usage : drawio-vers-svg.mjs <fichier.drawio> <page> <sortie.svg>");

const source = readFileSync(fichier, "utf8");
const page = source.split("<diagram ").slice(1).find((p) => p.startsWith(`id=`) && p.includes(`name="${nomPage}"`));
if (!page) throw new Error(`page introuvable : ${nomPage}`);

const decoder = (t) =>
  t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Texte HTML d'une cellule → paragraphes (les <br> et <div> coupent la ligne). */
const paragraphes = (valeur) =>
  decoder(decoder(valeur))
    .replace(/<br\s*\/?>|<\/div>|<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/ /g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
const styleDe = (s) => Object.fromEntries(s.split(";").filter(Boolean).map((kv) => (kv.includes("=") ? kv.split("=") : [kv, true])));

/** Coupe un paragraphe pour tenir dans `largeur` px (chasse moyenne de Helvetica ≈ 0,55 em). */
function couper(texte, largeur, taille) {
  const max = Math.max(8, Math.floor(largeur / (taille * 0.55)));
  const lignes = [];
  let ligne = "";
  for (const mot of texte.split(" ")) {
    if (ligne && (ligne + " " + mot).length > max) {
      lignes.push(ligne);
      ligne = mot;
    } else ligne = ligne ? ligne + " " + mot : mot;
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

const cellules = [...page.matchAll(/<mxCell ([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/g)].map((m) => {
  const attr = (n) => m[1].match(new RegExp(`\\b${n}="([^"]*)"`))?.[1];
  const geo = (m[2] ?? "").match(/<mxGeometry([^>]*)>/)?.[1] ?? "";
  const g = (n) => Number(geo.match(new RegExp(`\\b${n}="([^"]*)"`))?.[1] ?? 0);
  return {
    id: attr("id"),
    sommet: attr("vertex") === "1",
    arete: attr("edge") === "1",
    source: attr("source"),
    cible: attr("target"),
    valeur: attr("value") ?? "",
    style: styleDe(attr("style") ?? ""),
    x: g("x"),
    y: g("y"),
    l: g("width"),
    h: g("height"),
  };
});
const parId = new Map(cellules.map((c) => [c.id, c]));
const sommets = cellules.filter((c) => c.sommet);
const aretes = cellules.filter((c) => c.arete);

/** Hauteur réservée au nom d'un acteur, sous sa silhouette. */
const ETIQUETTE_ACTEUR = 24;
const POLICE = 'font-family="Helvetica, Arial, sans-serif"';
const corps = [];
// Ordre de dessin : les traits sous les formes (une association ne barre pas une ellipse), les
// libellés d'arêtes par-dessus tout.
const traits = [];
const etiquettes = [];

function texteCentre(lignes, cx, cy, taille, couleur, gras = false) {
  const hl = taille * 1.25;
  const y0 = cy - ((lignes.length - 1) * hl) / 2 + taille * 0.35;
  return lignes
    .map(
      (l, i) =>
        `<text x="${cx}" y="${(y0 + i * hl).toFixed(1)}" text-anchor="middle" font-size="${taille}" fill="${couleur}"${gras ? ' font-weight="bold"' : ""} ${POLICE}>${echapper(l)}</text>`,
    )
    .join("");
}

for (const s of sommets) {
  const st = s.style;
  const taille = Number(st.fontSize ?? 12);
  const couleurTexte = st.fontColor ?? "#1F2933";
  const trait = st.strokeColor ?? "#1F2933";
  const epaisseur = Number(st.strokeWidth ?? 1);
  const tirets = st.dashed ? ' stroke-dasharray="6 4"' : "";
  if (st.ellipse) {
    const cx = s.x + s.l / 2;
    const cy = s.y + s.h / 2;
    corps.push(`<ellipse cx="${cx}" cy="${cy}" rx="${s.l / 2}" ry="${s.h / 2}" fill="${st.fillColor ?? "#fff"}" stroke="${trait}" stroke-width="${epaisseur}"${tirets}/>`);
    const lignes = paragraphes(s.valeur).flatMap((p) => couper(p, s.l * 0.78, taille));
    corps.push(texteCentre(lignes, cx, cy, taille, couleurTexte));
  } else if (st.shape === "umlActor") {
    const cx = s.x + s.l / 2;
    const r = s.h * 0.12;
    const tete = s.y + r;
    const cou = s.y + 2 * r;
    const hanche = s.y + s.h * 0.62;
    const attr = `stroke="${trait}" stroke-width="${epaisseur}" fill="none"`;
    corps.push(
      `<circle cx="${cx}" cy="${tete}" r="${r}" fill="${st.fillColor ?? "#fff"}" stroke="${trait}" stroke-width="${epaisseur}"/>`,
      `<path d="M${cx} ${cou} V${hanche} M${s.x} ${s.y + s.h * 0.38} H${s.x + s.l} M${cx} ${hanche} L${s.x} ${s.y + s.h} M${cx} ${hanche} L${s.x + s.l} ${s.y + s.h}" ${attr}/>`,
      texteCentre(paragraphes(s.valeur), cx, s.y + s.h + taille + 4, taille + 1, couleurTexte, true),
    );
  } else if (st.shape === "note") {
    const pli = Number(st.size ?? 16);
    corps.push(
      `<path d="M${s.x} ${s.y} H${s.x + s.l - pli} L${s.x + s.l} ${s.y + pli} V${s.y + s.h} H${s.x} Z" fill="${st.fillColor ?? "#fff"}" stroke="${trait}"/>`,
      `<path d="M${s.x + s.l - pli} ${s.y} V${s.y + pli} H${s.x + s.l}" fill="none" stroke="${trait}"/>`,
    );
    const marge = Number(st.spacing ?? 6);
    const lignes = paragraphes(s.valeur).flatMap((p) => couper(p, s.l - 2 * marge - pli / 2, taille));
    lignes.forEach((l, i) =>
      corps.push(`<text x="${s.x + marge}" y="${s.y + marge + taille + i * taille * 1.3}" font-size="${taille}" fill="${couleurTexte}" ${POLICE}>${echapper(l)}</text>`),
    );
  } else if (st.rounded !== undefined || st.text) {
    // Cadre du système (titre en haut) ou texte libre.
    if (!st.text) corps.push(`<rect x="${s.x}" y="${s.y}" width="${s.l}" height="${s.h}" fill="${st.fillColor === "none" ? "none" : (st.fillColor ?? "none")}" stroke="${trait}" stroke-width="${epaisseur}"/>`);
    const lignes = paragraphes(s.valeur).flatMap((p) => couper(p, s.l - 16, taille));
    lignes.forEach((l, i) =>
      corps.push(`<text x="${s.x + s.l / 2}" y="${s.y + 10 + taille + i * taille * 1.3}" text-anchor="middle" font-size="${taille}" fill="${couleurTexte}"${st.fontStyle === "1" ? ' font-weight="bold"' : ""} ${POLICE}>${echapper(l)}</text>`),
    );
  } else {
    throw new Error(`forme non prise en charge : ${JSON.stringify(st)}`);
  }
}

/** Point du bord de `s` sur la droite qui va de son centre vers `p`. */
function bord(s, p) {
  // Un acteur compte avec son nom, écrit dessous : une flèche qui l'atteint par le bas s'arrête
  // sous le nom au lieu de le barrer.
  const h = s.style.shape === "umlActor" ? s.h + ETIQUETTE_ACTEUR : s.h;
  const cx = s.x + s.l / 2;
  const cy = s.y + h / 2;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const a = s.l / 2;
  const b = h / 2;
  const k = s.style.ellipse ? 1 / Math.hypot(dx / a, dy / b) : Math.min(a / Math.abs(dx || 1e-9), b / Math.abs(dy || 1e-9));
  return { x: cx + dx * k, y: cy + dy * k };
}
const centre = (s) => ({ x: s.x + s.l / 2, y: s.y + s.h / 2 });

for (const e of aretes) {
  const src = parId.get(e.source);
  const dst = parId.get(e.cible);
  if (!src || !dst) throw new Error(`arête ${e.id} sans extrémités`);
  const st = e.style;
  const depart = st.exitX !== undefined ? { x: src.x + src.l * Number(st.exitX), y: src.y + src.h * Number(st.exitY) } : bord(src, centre(dst));
  const arrivee = bord(dst, depart);
  const trait = st.strokeColor ?? "#1F2933";
  traits.push(`<line x1="${depart.x.toFixed(1)}" y1="${depart.y.toFixed(1)}" x2="${arrivee.x.toFixed(1)}" y2="${arrivee.y.toFixed(1)}" stroke="${trait}"${st.dashed ? ' stroke-dasharray="6 4"' : ""}/>`);
  const angle = Math.atan2(arrivee.y - depart.y, arrivee.x - depart.x);
  const pointe = (longueur, ecart) => [angle + ecart, angle - ecart].map((t) => ({ x: arrivee.x - longueur * Math.cos(t), y: arrivee.y - longueur * Math.sin(t) }));
  if (st.endArrow === "open") {
    const [g, d] = pointe(Number(st.endSize ?? 10), 0.45);
    traits.push(`<path d="M${g.x.toFixed(1)} ${g.y.toFixed(1)} L${arrivee.x.toFixed(1)} ${arrivee.y.toFixed(1)} L${d.x.toFixed(1)} ${d.y.toFixed(1)}" fill="none" stroke="${trait}"/>`);
  } else if (st.endArrow === "block") {
    const [g, d] = pointe(Number(st.endSize ?? 12), 0.5);
    traits.push(`<path d="M${g.x.toFixed(1)} ${g.y.toFixed(1)} L${arrivee.x.toFixed(1)} ${arrivee.y.toFixed(1)} L${d.x.toFixed(1)} ${d.y.toFixed(1)} Z" fill="${st.endFill === "0" ? "#fff" : trait}" stroke="${trait}"/>`);
  } else if (st.endArrow !== "none") {
    throw new Error(`extrémité non prise en charge : ${st.endArrow}`);
  }
  const libelle = paragraphes(e.valeur).join(" ");
  if (libelle) {
    const taille = Number(st.fontSize ?? 10);
    const mx = (depart.x + arrivee.x) / 2;
    const my = (depart.y + arrivee.y) / 2;
    const l = libelle.length * taille * 0.55 + 8;
    etiquettes.push(
      `<rect x="${(mx - l / 2).toFixed(1)}" y="${(my - taille).toFixed(1)}" width="${l.toFixed(1)}" height="${taille * 1.6}" fill="#fbfcfd"/>`,
      `<text x="${mx.toFixed(1)}" y="${(my + taille * 0.35).toFixed(1)}" text-anchor="middle" font-size="${taille}" fill="${st.fontColor ?? trait}" ${POLICE}>${echapper(libelle)}</text>`,
    );
  }
}

// Cadrage : tous les sommets, plus la place des libellés d'acteurs, avec une marge.
const marge = 20;
const minX = Math.min(...sommets.map((s) => s.x)) - marge;
const minY = Math.min(...sommets.map((s) => s.y)) - marge;
const maxX = Math.max(...sommets.map((s) => s.x + s.l)) + marge;
const maxY = Math.max(...sommets.map((s) => s.y + s.h + (s.style.shape === "umlActor" ? ETIQUETTE_ACTEUR : 0))) + marge;
const l = Math.ceil(maxX - minX);
const h = Math.ceil(maxY - minY);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${l} ${h}" width="${l}" height="${h}"><rect x="${minX}" y="${minY}" width="${l}" height="${h}" fill="#fbfcfd"/>${traits.join("")}${corps.join("")}${etiquettes.join("")}</svg>\n`;
writeFileSync(sortie, svg);
console.log(`${sortie} : ${l}×${h}, ${sommets.length} sommets, ${aretes.length} arêtes`);
