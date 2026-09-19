type Boite = { titre: string; sous: string };

// Trois boîtes à deux lignes (titre + sous-titre) ne tiennent pas proprement dans le cadre d'une
// carte de projet (environ 240px de large) à 11px de police minimum : marge intérieure écrasée,
// titre et sous-titre collés. Le mini-schéma n'affiche donc que les TITRES, sur une seule ligne,
// avec une vraie marge. Les sous-titres ne sont pas perdus : ils rejoignent les titres dans le nom
// accessible du schéma (aria-label) — les technologies restent de toute façon listées en
// étiquettes sous le schéma (cf. ProjectCard, FeaturedCase).
const TAILLE_TITRE = 18;
const MARGE_BOITE_X = 10;
const MARGE_BOITE_Y = 12;
const MARGE_EXTERIEURE = 10;
const ECART = 16;
// Chasse moyenne par caractère, par em (police à empattements proportionnels, cf. .d-t) :
// légèrement au-dessus de la largeur réellement mesurée sur les libellés du site, en marge de
// sécurité.
const CHASSE_TITRE = 0.6;
// Hauteur du texte au-dessus et en dessous de la ligne de base, par em (police .d-t) : mesurée
// une fois sur les titres réels (getBBox), pour centrer verticalement sans dépendre du support de
// dominant-baseline par le moteur de rendu.
const FACTEUR_ASCENDANCE = 0.98;
const FACTEUR_DESCENTE = 0.26;
// Somme des longueurs des trois titres, la plus grande relevée parmi tous les miniSchema de
// content/projets/*.mdx (Hackathon MCN : « QR code » + « App mobile » + « Audio » = 22
// caractères). Fixe une largeur de schéma (viewBox) commune à tous les projets : à somme égale ou
// inférieure, les boîtes se partagent cette même largeur totale, le surplus étant réparti entre
// elles au prorata de leur propre titre. Augmenter cette valeur si un futur projet la dépasse.
const SOMME_CARACTERES_MAX = 22;

const LARGEUR_TOTALE =
  SOMME_CARACTERES_MAX * CHASSE_TITRE * TAILLE_TITRE + 6 * MARGE_BOITE_X + 2 * MARGE_EXTERIEURE + 2 * ECART;
const LARGEUR_DISPONIBLE_BOITES = LARGEUR_TOTALE - 2 * MARGE_EXTERIEURE - 2 * ECART;
const HAUTEUR_TEXTE = TAILLE_TITRE * (FACTEUR_ASCENDANCE + FACTEUR_DESCENTE);
const HAUTEUR_BOITE = HAUTEUR_TEXTE + 2 * MARGE_BOITE_Y;
const HAUTEUR_TOTALE = HAUTEUR_BOITE + 2 * MARGE_EXTERIEURE;

/**
 * Schéma miniature des cartes de projet : trois boîtes reliées, celle du milieu mise en avant.
 * Largeur de viewBox fixe (LARGEUR_TOTALE, indépendante du contenu) : tous les schémas de la page
 * partagent donc la même échelle une fois mis à l'échelle dans le cadre de leur carte. Les
 * largeurs de boîtes restent proportionnelles au titre qu'elles portent, dans cette largeur
 * totale fixe.
 */
export function MiniDiagram({ boites, label }: { boites: readonly [Boite, Boite, Boite]; label: string }) {
  const largeursMin = boites.map((b) => b.titre.length * CHASSE_TITRE * TAILLE_TITRE + 2 * MARGE_BOITE_X);
  const sommeMin = largeursMin.reduce((a, b) => a + b, 0);
  const echelleBoites = LARGEUR_DISPONIBLE_BOITES / sommeMin;
  const largeurs = largeursMin.map((l) => l * echelleBoites);

  const positionsX: number[] = [];
  let x = MARGE_EXTERIEURE;
  for (const largeur of largeurs) {
    positionsX.push(x);
    x += largeur + ECART;
  }

  const yMilieu = MARGE_EXTERIEURE + HAUTEUR_BOITE / 2;
  const yTexte = MARGE_EXTERIEURE + MARGE_BOITE_Y + TAILLE_TITRE * FACTEUR_ASCENDANCE;
  const description = boites.map((b) => `${b.titre} (${b.sous})`).join(", ");

  return (
    <svg viewBox={`0 0 ${LARGEUR_TOTALE} ${HAUTEUR_TOTALE}`} role="img" aria-label={`${label} : ${description}`}>
      {boites.map((b, i) => (
        <g key={b.titre}>
          <rect
            className={i === 1 ? "d-box-acc" : "d-box"}
            x={positionsX[i]}
            y={MARGE_EXTERIEURE}
            width={largeurs[i]}
            height={HAUTEUR_BOITE}
          />
          <text
            className="d-t"
            x={positionsX[i] + largeurs[i] / 2}
            y={yTexte}
            textAnchor="middle"
            style={{ fontSize: TAILLE_TITRE }}
          >
            {b.titre}
          </text>
        </g>
      ))}
      {[0, 1].map((i) => {
        const xDebut = positionsX[i] + largeurs[i];
        const xFin = positionsX[i + 1];
        return (
          <g key={xDebut}>
            <path className="d-flow" d={`M${xDebut} ${yMilieu} L${xFin} ${yMilieu}`} />
            <path className="d-packet" pathLength={100} d={`M${xDebut} ${yMilieu} L${xFin} ${yMilieu}`} />
            <polygon
              className="d-head"
              points={`${xFin},${yMilieu} ${xFin - 4},${yMilieu - 3} ${xFin - 4},${yMilieu + 3}`}
            />
          </g>
        );
      })}
    </svg>
  );
}
