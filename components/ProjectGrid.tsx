"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { filtrerProjets, lireCategorie } from "@/lib/filters";
import { categories, categorieLabel, type Categorie } from "@/lib/schemas";

type Carte = { slug: string; categories: readonly string[]; carte: ReactNode };

function libelleCompte(n: number) {
  return `${n} dossier${n > 1 ? "s" : ""}`;
}

/**
 * Grille filtrable. Les cartes sont rendues côté serveur et passées telles quelles ;
 * ce composant ne fait que choisir lesquelles afficher selon `?categorie=`.
 */
export function ProjectGrid({ cartes }: { cartes: Carte[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const chemin = usePathname();
  const active = lireCategorie(params.get("categorie"));
  const visibles = filtrerProjets(cartes, active);

  function choisir(cle: Categorie | null) {
    router.replace(cle ? `${chemin}?categorie=${cle}` : chemin, { scroll: false });
  }

  const onglets: { cle: Categorie | null; libelle: string }[] = [
    { cle: null, libelle: "Tous" },
    ...categories.map((cle) => ({ cle, libelle: categorieLabel[cle] })),
  ];

  return (
    <>
      <div className="pa-filterbar">
        <div className="pa-tabs" role="group" aria-label="Filtrer les projets">
          {onglets.map((o) => (
            <button key={o.libelle} type="button" aria-pressed={active === o.cle} onClick={() => choisir(o.cle)}>
              {o.libelle}
            </button>
          ))}
        </div>
        <span className="pa-meta" aria-live="polite" data-testid="compteur">
          {libelleCompte(visibles.length)}
        </span>
      </div>
      <div className="pa-grid pa-grid-projets">
        {visibles.map((c) => (
          <div key={c.slug}>{c.carte}</div>
        ))}
      </div>
    </>
  );
}

/** Version sans JavaScript et pendant le chargement : toutes les cartes. */
export function ProjectGridStatique({ cartes }: { cartes: Carte[] }) {
  return (
    <>
      <div className="pa-filterbar">
        <div className="pa-tabs" role="group" aria-label="Filtrer les projets">
          <button type="button" aria-pressed="true">
            Tous
          </button>
          {categories.map((cle) => (
            <button key={cle} type="button" aria-pressed="false" disabled>
              {categorieLabel[cle]}
            </button>
          ))}
        </div>
        <span className="pa-meta">{libelleCompte(cartes.length)}</span>
      </div>
      <div className="pa-grid pa-grid-projets">
        {cartes.map((c) => (
          <div key={c.slug}>{c.carte}</div>
        ))}
      </div>
    </>
  );
}
