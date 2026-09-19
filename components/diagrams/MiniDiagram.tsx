type Boite = { titre: string; sous: string };

// Largeur du cadre disponible pour ces mini-schémas (carte de projet, .pa-card-fig) : environ
// 243px au point le plus serré (grille à trois colonnes, ~1024px). Avec trois boîtes de largeur
// fixe, un libellé plus long que les autres imposerait sa largeur aux trois — au prix d'un texte
// minuscule une fois mis à l'échelle. Chaque boîte est donc dimensionnée sur SON PROPRE contenu
// (titre et sous-titre réels, cf. miniSchema de chaque projet dans content/projets/*.mdx), ce qui
// réduit d'autant la largeur totale du schéma et augmente la mise à l'échelle du texte.
const DECALAGE_TEXTE = 5;
const MARGE_BOITE = 2;
const ECART = 4;
const MARGE_EXTERIEURE = 2;
const TAILLE_TITRE = 15;
const TAILLE_SOUS = 15;
// Largeur moyenne d'un caractère, par em : chasse variable pour .d-t (police à empattements
// proportionnels), chasse fixe pour .d-s (police mono) — un peu au-dessus de la largeur réelle
// mesurée sur les libellés du site, en marge de sécurité.
const CHASSE_TITRE = 0.6;
const CHASSE_SOUS = 0.64;

function largeurBoite(b: Boite) {
  const largeurTitre = b.titre.length * CHASSE_TITRE * TAILLE_TITRE;
  const largeurSous = b.sous.length * CHASSE_SOUS * TAILLE_SOUS;
  return DECALAGE_TEXTE + Math.max(largeurTitre, largeurSous) + MARGE_BOITE;
}

/** Schéma miniature des cartes de projet : trois boîtes reliées, celle du milieu mise en avant. */
export function MiniDiagram({ boites, label }: { boites: readonly [Boite, Boite, Boite]; label: string }) {
  const largeurs = boites.map(largeurBoite);
  const positionsX: number[] = [];
  let x = MARGE_EXTERIEURE;
  for (const largeur of largeurs) {
    positionsX.push(x);
    x += largeur + ECART;
  }
  const largeurTotale = x - ECART + MARGE_EXTERIEURE;

  return (
    <svg viewBox={`0 0 ${largeurTotale} 64`} role="img" aria-label={label}>
      {boites.map((b, i) => (
        <g key={b.titre}>
          <rect className={i === 1 ? "d-box-acc" : "d-box"} x={positionsX[i]} y="10" width={largeurs[i]} height="44" />
          <text className="d-t" x={positionsX[i] + DECALAGE_TEXTE} y="30" style={{ fontSize: TAILLE_TITRE }}>
            {b.titre}
          </text>
          <text className="d-s" x={positionsX[i] + DECALAGE_TEXTE} y="45" style={{ fontSize: TAILLE_SOUS }}>
            {b.sous}
          </text>
        </g>
      ))}
      {[0, 1].map((i) => {
        const xDebut = positionsX[i] + largeurs[i];
        const xFin = positionsX[i + 1];
        return (
          <g key={xDebut}>
            <path className="d-flow" d={`M${xDebut} 32 L${xFin} 32`} />
            <path className="d-packet" pathLength={100} d={`M${xDebut} 32 L${xFin} 32`} />
            <polygon className="d-head" points={`${xFin},32 ${xFin - 4},29 ${xFin - 4},35`} />
          </g>
        );
      })}
    </svg>
  );
}
