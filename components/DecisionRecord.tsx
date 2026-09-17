type Option = { libelle: string; note?: string; retenue?: boolean };

export type DecisionRecordProps = {
  numero: string;
  titre: string;
  statut?: string;
  contexte: string;
  options: Option[];
  decision: string;
  consequences: string;
};

/** Une décision est « acceptée » indépendamment des accents ou de la casse du texte MDX. */
function estAcceptee(statut: string) {
  return (
    statut
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase() === "acceptee"
  );
}

/** Fiche de décision d'architecture (ADR) — gabarit unique. */
export function DecisionRecord({
  numero,
  titre,
  statut = "Acceptée",
  contexte,
  options,
  decision,
  consequences,
}: DecisionRecordProps) {
  const acceptee = estAcceptee(statut);
  return (
    <article className="pa-surface pa-adr">
      <div className="pa-head">
        <span className="pa-meta">
          Fiche de décision<span className="pa-sep">—</span>ADR-{numero}
        </span>
        <span className="pa-meta">
          <span className={acceptee ? "pa-st-ok" : "pa-st-open"}>
            <span className={acceptee ? "pa-dot is-accepte" : "pa-dot is-open"} />
            {statut}
          </span>
        </span>
      </div>
      <div className="pa-adr-title">
        <h3 className="pa-h3">{titre}</h3>
      </div>
      <dl>
        <div>
          <dt>Contexte</dt>
          <dd>{contexte}</dd>
        </div>
        <div>
          <dt>Options étudiées</dt>
          <dd>
            <ul>
              {options.map((o) =>
                o.retenue ? (
                  <li className="pa-kept" key={o.libelle}>
                    {o.libelle} — retenue
                  </li>
                ) : (
                  <li key={o.libelle}>
                    {o.libelle}
                    {o.note ? (
                      <>
                        {" — "}
                        <span className="pa-muted">{o.note}</span>
                      </>
                    ) : null}
                  </li>
                ),
              )}
            </ul>
          </dd>
        </div>
        <div className="is-decision">
          <dt>Décision</dt>
          <dd>{decision}</dd>
        </div>
        <div>
          <dt>Conséquences</dt>
          <dd>{consequences}</dd>
        </div>
      </dl>
    </article>
  );
}
