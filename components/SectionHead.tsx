import Link from "next/link";

export function SectionHead({
  meta,
  titre,
  lien,
  id,
}: {
  meta: string;
  titre: string;
  lien?: { href: string; libelle: string };
  id?: string;
}) {
  return (
    <div className="pa-sechead">
      <div>
        <span className="pa-meta">{meta}</span>
        <h2 className="pa-h2" id={id}>
          {titre}
        </h2>
      </div>
      {lien ? (
        <Link className="pa-link" href={lien.href}>
          {lien.libelle} →
        </Link>
      ) : null}
    </div>
  );
}

/** Numérote les sections affichées (« 01 / Domaines ») sans laisser de trou quand une section est masquée. */
export function numeroteur() {
  let n = 0;
  return (libelle: string) => `${String(++n).padStart(2, "0")} / ${libelle}`;
}
