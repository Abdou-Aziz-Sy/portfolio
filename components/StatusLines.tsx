import type { LigneStatut } from "@/lib/schemas";

export function StatusLines({ lignes }: { lignes: LigneStatut[] }) {
  return (
    <ul className="pa-status">
      {lignes.map((l) => (
        <li key={l.service}>
          <span>{l.detail ? `${l.service} ${l.detail}` : l.service}</span>
          <span>
            <span className="pa-dot" />
            {l.etat}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Lignes « avant » d'une étude de cas : flux suivis sans outil, en accent. */
export function FluxAvant({ flux }: { flux: [string, string][] }) {
  return (
    <div className="pa-surface" style={{ padding: "16px 20px" }}>
      <span className="pa-meta">Flux suivis avant</span>
      <ul className="pa-status" style={{ marginTop: 8 }}>
        {flux.map(([quoi, comment]) => (
          <li className="is-open" key={quoi}>
            <span>{quoi}</span>
            <span>{comment}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
