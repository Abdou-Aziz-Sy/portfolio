type Boite = { titre: string; sous: string };

const X = [2, 116, 230];

/** Schéma miniature des cartes de projet : trois boîtes reliées, celle du milieu mise en avant. */
export function MiniDiagram({ boites, label }: { boites: readonly [Boite, Boite, Boite]; label: string }) {
  return (
    <svg viewBox="0 0 320 64" role="img" aria-label={label}>
      {boites.map((b, i) => (
        <g key={b.titre}>
          <rect className={i === 1 ? "d-box-acc" : "d-box"} x={X[i]} y="10" width="88" height="44" />
          <text className="d-t" x={X[i] + 10} y="30" style={{ fontSize: 12 }}>
            {b.titre}
          </text>
          <text className="d-s" x={X[i] + 10} y="45" style={{ fontSize: 9.5 }}>
            {b.sous}
          </text>
        </g>
      ))}
      {[90, 204].map((x) => (
        <g key={x}>
          <path className="d-flow" d={`M${x} 26 L${x + 26} 26`} />
          <path className="d-packet" pathLength={100} d={`M${x} 26 L${x + 26} 26`} />
          <polygon className="d-head" points={`${x + 26},26 ${x + 19},22 ${x + 19},30`} />
          <path className="d-line" d={`M${x + 26} 40 L${x} 40`} />
          <polygon className="d-head-m" points={`${x},40 ${x + 7},36 ${x + 7},44`} />
        </g>
      ))}
    </svg>
  );
}
