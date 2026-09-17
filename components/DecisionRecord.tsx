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
  return (
    <article className="pa-surface pa-adr">
      <div className="pa-head">
        <span className="pa-meta">
          Fiche de décision<span className="pa-sep">—</span>ADR-{numero}
        </span>
        <span className="pa-meta">
          <span className="pa-st-open">
            <span className="pa-dot is-open" />
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
