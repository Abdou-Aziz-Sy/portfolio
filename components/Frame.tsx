import Image from "next/image";
import { site } from "@/content/site";

/**
 * Portrait dans un cartouche de plan. Sans photo fournie, le cartouche affiche les initiales.
 * La hauteur dépend de la variante et du point de rupture (styles/ajouts.css).
 */
export function Frame({ feuille, variante }: { feuille: string; variante: "accueil" | "apropos" }) {
  const portrait = site.portraits[variante];
  return (
    <figure className={`pa-frame pa-frame--${variante}`}>
      {portrait ? (
        <Image
          className="pa-frame-media"
          src={portrait}
          alt={`Portrait de ${site.nom}`}
          width={720}
          height={840}
          // `preload`, pas `priority` : ce dernier est déprécié depuis Next 16
          // (node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md).
          // Précharger ne se justifie que pour l'élément le plus grand de la page : c'est le
          // portrait sur « à propos », mais le titre sur l'accueil, où précharger l'image lui
          // disputait le chemin critique (94 au lieu de 95 en performance). `loading="eager"`
          // ne résout rien ici : Next en déduit lui aussi un préchargement.
          preload={variante === "apropos"}
          sizes={variante === "accueil" ? "(max-width: 767px) 160px, 460px" : "(max-width: 767px) 100vw, 420px"}
        />
      ) : (
        <div className="pa-ph pa-frame-media" role="img" aria-label={`Initiales d'${site.nom}`}>
          <span className="pa-initiales" aria-hidden="true">
            {site.initiales}
          </span>
        </div>
      )}
      <figcaption className="pa-frame-block pa-meta">
        <span>
          {site.signature} — {site.villeCourte}
        </span>
        <span>FEUILLE {feuille}</span>
      </figcaption>
    </figure>
  );
}
