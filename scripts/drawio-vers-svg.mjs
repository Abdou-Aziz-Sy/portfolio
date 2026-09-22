// Convertit une page d'un fichier draw.io (non compressé) en SVG autonome, pour le site.
// Usage : node scripts/drawio-vers-svg.mjs <fichier.drawio> <nom de la page> <sortie.svg> [modele|annexes]
//
// Couvre les diagrammes de cas d'utilisation (cadre du système, ellipses, acteurs, notes) et de
// classes (classes à compartiments, arêtes orthogonales à points de passage, compositions,
// multiplicités). Les coordonnées et couleurs sont celles du fichier : le SVG est une
// transcription, pas un redessin. Toute forme inconnue fait échouer le script plutôt que de disparaître en silence.
import { readFileSync, writeFileSync } from "node:fs";

const [fichier, nomPage, sortie, partie] = process.argv.slice(2);
if (!sortie) throw new Error("usage : drawio-vers-svg.mjs <fichier.drawio> <page> <sortie.svg> [modele|annexes]");
if (partie && !["modele", "annexes"].includes(partie)) throw new Error(`partie inconnue : ${partie}`);

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
  const point = (a) => ({ x: Number(a.match(/\bx="([^"]*)"/)?.[1] ?? 0), y: Number(a.match(/\by="([^"]*)"/)?.[1] ?? 0) });
  const tableau = (m[2] ?? "").match(/<Array as="points">([\s\S]*?)<\/Array>/)?.[1] ?? "";
  const decalage = (m[2] ?? "").match(/<mxPoint([^>]*)as="offset"/)?.[1];
  return {
    id: attr("id"),
    parent: attr("parent"),
    points: [...tableau.matchAll(/<mxPoint([^>]*)\/>/g)].map((p) => point(p[1])),
    decalage: decalage ? point(decalage) : { x: 0, y: 0 },
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
// Les lignes d'une classe (compartiment) sont placées relativement à leur classe : on les ramène
// dans le repère de la page. Les libellés d'arêtes (edgeLabel) restent rattachés à leur arête.
for (const c of cellules) {
  const parent = parId.get(c.parent);
  if (c.sommet && parent?.sommet) {
    c.x += parent.x;
    c.y += parent.y;
  }
}
// Partie d'un diagramme de classes (4e argument, facultatif) : `modele` garde les classes et leurs
// associations, `annexes` les énumérations et les notes. Les enfants suivent leur parent ; une
// arête n'est gardée que si ses deux extrémités le sont.
const enumeration = (c) => c.style.swimlane && c.valeur.includes("enumeration");
const garde = {
  modele: (c) => c.style.swimlane && !enumeration(c),
  annexes: (c) => enumeration(c) || c.style.shape === "note",
}[partie ?? ""] ?? (() => true);
const racine = (c) => (parId.get(c.parent)?.sommet ? racine(parId.get(c.parent)) : c);
const gardee = (c) => (c.arete ? gardee(parId.get(c.source)) && gardee(parId.get(c.cible)) : c.style.edgeLabel ? gardee(parId.get(c.parent)) : garde(racine(c)));
const sommets = cellules.filter((c) => c.sommet && !c.style.edgeLabel && gardee(c));
const libellesDArete = cellules.filter((c) => c.style.edgeLabel);
const aretes = cellules.filter((c) => c.arete && gardee(c));

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
  } else if (st.swimlane) {
    // Classe UML : en-tête (nom, stéréotype éventuel) puis compartiment des attributs.
    const entete = Number(st.startSize ?? 26);
    corps.push(
      `<rect x="${s.x}" y="${s.y}" width="${s.l}" height="${s.h}" fill="#fff" stroke="${trait}" stroke-width="${epaisseur}"/>`,
      `<rect x="${s.x}" y="${s.y}" width="${s.l}" height="${entete}" fill="${st.fillColor ?? "#fff"}" stroke="${trait}" stroke-width="${epaisseur}"/>`,
      texteCentre(paragraphes(s.valeur), s.x + s.l / 2, s.y + entete / 2, taille, couleurTexte, st.fontStyle === "1"),
    );
  } else if (st.text) {
    // Ligne d'un compartiment : alignée à gauche, centrée verticalement.
    for (const ligne of paragraphes(s.valeur))
      corps.push(`<text x="${s.x + Number(st.spacingLeft ?? 4)}" y="${(s.y + s.h / 2 + taille * 0.35).toFixed(1)}" font-size="${taille}" fill="${couleurTexte}" ${POLICE}>${echapper(ligne)}</text>`);
  } else if (st.rounded !== undefined) {
    // Cadre du système (titre en haut).
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

/** Points du tracé. En style orthogonal, deux points consécutifs qui ne partagent ni x ni y
 *  reçoivent un coude : on part dans le sens de la sortie (horizontal si elle est sur un côté
 *  gauche/droit), et on arrive dans le sens de l'entrée. */
function trace(depart, points, arrivee, st) {
  const bruts = [depart, ...points, arrivee];
  if (st.edgeStyle !== "orthogonalEdgeStyle") return bruts;
  const lateral = (v) => v === "0" || v === "1";
  const chemin = [bruts[0]];
  for (let i = 1; i < bruts.length; i++) {
    const a = chemin.at(-1);
    const b = bruts[i];
    if (Math.abs(a.x - b.x) > 0.5 && Math.abs(a.y - b.y) > 0.5) {
      const dernier = i === bruts.length - 1;
      const verticalDabord = (i === 1 && st.exitX !== undefined && !lateral(st.exitX)) || (dernier && lateral(st.entryX));
      chemin.push(verticalDabord ? { x: a.x, y: b.y } : { x: b.x, y: a.y });
    }
    chemin.push(b);
  }
  return chemin;
}

/** Attribut `d` d'une polyligne, coins arrondis de rayon `r` (0 : coins vifs). */
function enChemin(pts, r) {
  const f = (q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  let d = `M${f(pts[0])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1], pts[i], pts[i + 1]];
    const k = Math.min(r, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    if (!k) {
      d += ` L${f(b)}`;
      continue;
    }
    const vers = (p, q) => {
      const n = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      return { x: p.x + ((q.x - p.x) / n) * k, y: p.y + ((q.y - p.y) / n) * k };
    };
    d += ` L${f(vers(b, a))} Q${f(b)} ${f(vers(b, c))}`;
  }
  return `${d} L${f(pts.at(-1))}`;
}

/** Point situé à la fraction `t` de la longueur d'une polyligne. */
function pointLeLong(pts, t) {
  const longueurs = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  let reste = longueurs.reduce((a, b) => a + b, 0) * t;
  for (let i = 0; i < longueurs.length; i++) {
    if (reste <= longueurs[i]) {
      const k = longueurs[i] ? reste / longueurs[i] : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    }
    reste -= longueurs[i];
  }
  return pts.at(-1);
}

/** Points à inclure dans le cadrage en plus des sommets (tracés, libellés d'arêtes). */
const cadre = [];

for (const e of aretes) {
  const src = parId.get(e.source);
  const dst = parId.get(e.cible);
  if (!src || !dst) throw new Error(`arête ${e.id} sans extrémités`);
  const st = e.style;
  const depart = st.exitX !== undefined ? { x: src.x + src.l * Number(st.exitX), y: src.y + src.h * Number(st.exitY) } : bord(src, e.points[0] ?? centre(dst));
  const arrivee =
    st.entryX !== undefined ? { x: dst.x + dst.l * Number(st.entryX), y: dst.y + dst.h * Number(st.entryY) } : bord(dst, e.points.at(-1) ?? depart);
  const trait = st.strokeColor ?? "#1F2933";
  const tirets = st.dashed ? ' stroke-dasharray="6 4"' : "";
  const chemin = trace(depart, e.points, arrivee, st);
  if (chemin.length === 2) {
    traits.push(`<line x1="${depart.x.toFixed(1)}" y1="${depart.y.toFixed(1)}" x2="${arrivee.x.toFixed(1)}" y2="${arrivee.y.toFixed(1)}" stroke="${trait}"${tirets}/>`);
  } else {
    traits.push(`<path d="${enChemin(chemin, st.rounded === "1" ? 8 : 0)}" fill="none" stroke="${trait}"${tirets}/>`);
  }
  if (st.startArrow === "diamondThin") {
    // Losange de composition, pointe sur la classe composite (la source).
    const [a, b] = [chemin[0], chemin[1]];
    const n = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const u = { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
    const L = 18;
    const E = 5;
    const m = { x: a.x + (u.x * L) / 2, y: a.y + (u.y * L) / 2 };
    const pts = [a, { x: m.x - u.y * E, y: m.y + u.x * E }, { x: a.x + u.x * L, y: a.y + u.y * L }, { x: m.x + u.y * E, y: m.y - u.x * E }];
    traits.push(`<path d="M${pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L")} Z" fill="${st.startFill === "0" ? "#fff" : trait}" stroke="${trait}"/>`);
  } else if (st.startArrow && st.startArrow !== "none") {
    throw new Error(`départ non pris en charge : ${st.startArrow}`);
  }
  const avantDernier = chemin.at(-2);
  const angle = Math.atan2(arrivee.y - avantDernier.y, arrivee.x - avantDernier.x);
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
  const etiqueter = (libelle, p, taille, couleur) => {
    const l = libelle.length * taille * 0.55 + 8;
    etiquettes.push(
      `<rect x="${(p.x - l / 2).toFixed(1)}" y="${(p.y - taille).toFixed(1)}" width="${l.toFixed(1)}" height="${taille * 1.6}" fill="#fbfcfd"/>`,
      `<text x="${p.x.toFixed(1)}" y="${(p.y + taille * 0.35).toFixed(1)}" text-anchor="middle" font-size="${taille}" fill="${couleur}" ${POLICE}>${echapper(libelle)}</text>`,
    );
    cadre.push({ x: p.x - l / 2, y: p.y - taille }, { x: p.x + l / 2, y: p.y + taille });
  };
  const libelle = paragraphes(e.valeur).join(" ");
  if (libelle) {
    const milieu = pointLeLong(chemin, 0.5);
    etiqueter(libelle, { x: milieu.x + e.decalage.x, y: milieu.y + e.decalage.y }, Number(st.fontSize ?? 10), st.fontColor ?? trait);
  }
  // Multiplicités (edgeLabel posé à x = -1 : côté source, x = 1 : côté cible). draw.io les centre
  // sur l'extrémité même, à cheval sur le bord de la classe ; on les écarte un peu le long du
  // premier (ou dernier) segment et sur le côté, pour qu'elles restent lisibles.
  for (const lbl of libellesDArete.filter((c) => c.parent === e.id)) {
    const texte = paragraphes(lbl.valeur).join(" ");
    if (!texte) continue;
    const cote = lbl.x < 0 ? [chemin[0], chemin[1]] : [chemin.at(-1), chemin.at(-2)];
    const [a, b] = cote;
    const n = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const u = { x: (b.x - a.x) / n, y: (b.y - a.y) / n };
    const p = lbl.x === 0 ? pointLeLong(chemin, 0.5) : { x: a.x + u.x * 16 - u.y * 10, y: a.y + u.y * 16 + u.x * 10 };
    etiqueter(texte, { x: p.x + lbl.decalage.x, y: p.y + lbl.decalage.y }, Number(lbl.style.fontSize ?? 10), lbl.style.fontColor ?? trait);
  }
  cadre.push(...chemin);
}

// Cadrage : tous les sommets, plus la place des libellés d'acteurs, avec une marge.
const marge = 20;
const minX = Math.floor(Math.min(...sommets.map((s) => s.x), ...cadre.map((p) => p.x))) - marge;
const minY = Math.floor(Math.min(...sommets.map((s) => s.y), ...cadre.map((p) => p.y))) - marge;
const maxX = Math.max(...sommets.map((s) => s.x + s.l), ...cadre.map((p) => p.x)) + marge;
const maxY = Math.max(...sommets.map((s) => s.y + s.h + (s.style.shape === "umlActor" ? ETIQUETTE_ACTEUR : 0)), ...cadre.map((p) => p.y)) + marge;
const l = Math.ceil(maxX - minX);
const h = Math.ceil(maxY - minY);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${l} ${h}" width="${l}" height="${h}"><rect x="${minX}" y="${minY}" width="${l}" height="${h}" fill="#fbfcfd"/>${traits.join("")}${corps.join("")}${etiquettes.join("")}</svg>\n`;
writeFileSync(sortie, svg);
console.log(`${sortie} : ${l}×${h}, ${sommets.length} sommets, ${aretes.length} arêtes`);
