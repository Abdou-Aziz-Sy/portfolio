import type { CleDomaine, Domaine } from "@/content/site";
import { TechIcon } from "@/components/TechIcon";

function Pictogramme({ cle }: { cle: CleDomaine }) {
  if (cle === "backend") {
    return (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <ellipse className="pic" cx="28" cy="12" rx="16" ry="5" />
        <path className="pic" d="M12 12 V40 A16 5 0 0 0 44 40 V12" />
        <path className="pic" d="M12 26 A16 5 0 0 0 44 26" />
        <path className="pic-a" d="M2 48 H20 M36 48 H54" />
        <circle className="pic-f" cx="28" cy="48" r="3" />
      </svg>
    );
  }
  if (cle === "systemes") {
    return (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <rect className="pic" x="4" y="4" width="18" height="14" />
        <rect className="pic" x="34" y="4" width="18" height="14" />
        <rect className="pic-a" x="19" y="38" width="18" height="14" />
        <path className="pic" d="M13 18 V28 H43 V18 M28 28 V38" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true">
      <rect className="pic" x="6" y="6" width="44" height="12" />
      <rect className="pic" x="6" y="22" width="44" height="12" />
      <circle className="pic-f" cx="14" cy="12" r="2" />
      <circle className="pic-f" cx="14" cy="28" r="2" />
      <path className="pic" d="M28 34 V42" />
      <path className="pic-a" d="M8 50 H20 L24 44 L30 54 L34 48 H48" />
    </svg>
  );
}

export function DomainColumns({ domaines, variante }: { domaines: Domaine[]; variante: "complete" | "breve" }) {
  return (
    <div className="pa-domains">
      {domaines.map((d) => (
        <div className="pa-domain" key={d.cle}>
          <Pictogramme cle={d.cle} />
          <div>
            <h3 className="pa-h3">{d.titre}</h3>
            <p className="pa-quote" style={{ marginTop: 6 }}>
              {d.phrase}
            </p>
          </div>
          {variante === "complete" ? (
            <>
              <div>
                <h4>Ce que je fais</h4>
                <ul>
                  {d.fais.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Outils</h4>
                <ul className="pa-tools">
                  {d.outils.map((o) => (
                    <li key={o.libelle}>
                      {o.icone ? <TechIcon name={o.icone} /> : null}
                      {o.libelle}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="pa-inline-logos">
              {d.outils.map((o) => (
                <span key={o.libelle}>
                  {o.icone ? <TechIcon name={o.icone} /> : null}
                  {o.libelle}
                </span>
              ))}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
