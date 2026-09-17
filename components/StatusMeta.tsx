import { statutLabel, type Statut } from "@/lib/schemas";

export function StatusMeta({ statut }: { statut: Statut }) {
  const libelle = statutLabel[statut];
  if (statut === "en-production") {
    return (
      <span className="pa-st-ok">
        <span className="pa-dot" />
        {libelle}
      </span>
    );
  }
  if (statut === "en-cours") {
    return (
      <span className="pa-st-open">
        <span className="pa-dot is-open" />
        {libelle}
      </span>
    );
  }
  return (
    <span>
      <span className="pa-dot is-done" />
      {libelle}
    </span>
  );
}

/** Méta séparée par des tirets : « Dossier 01 — UGB Link — 2026 ». */
export function MetaLine({ parties }: { parties: React.ReactNode[] }) {
  return (
    <>
      {parties.map((partie, i) => (
        <span key={i}>
          {i > 0 ? <span className="pa-sep">—</span> : null}
          {partie}
        </span>
      ))}
    </>
  );
}
