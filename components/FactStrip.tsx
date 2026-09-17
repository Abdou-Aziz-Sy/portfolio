export function FactStrip({ faits }: { faits: { valeur: string; unite?: string; libelle: string }[] }) {
  return (
    <dl className="pa-facts" style={{ margin: 0 }}>
      {faits.map((f) => (
        <div className="pa-fact" key={f.libelle}>
          <dt className="pa-sr">{f.libelle}</dt>
          <dd style={{ margin: 0 }}>
            <b>
              {f.valeur}
              {f.unite ? <small>{f.unite}</small> : null}
            </b>
            <span aria-hidden="true">{f.libelle}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
