type Fait = { valeur: string; unite?: string; libelle: string };

/**
 * Chiffres clés. La variante « compacte » est la version de première vue mobile ;
 * la variante « bandeau » est la section de l'accueil. Une seule des deux est affichée
 * à une largeur donnée (styles/mise-en-page.css), donc chaque fait n'est lu qu'une fois.
 */
export function FactStrip({ faits, variante = "bandeau" }: { faits: Fait[]; variante?: "bandeau" | "compacte" }) {
  return (
    <dl
      className={variante === "compacte" ? "pa-facts pa-facts--hero" : "pa-facts pa-facts--bandeau"}
      style={{ margin: 0 }}
      data-testid={variante === "compacte" ? "faits-hero" : undefined}
    >
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
