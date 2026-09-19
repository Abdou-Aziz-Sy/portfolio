import Image from "next/image";
import { site } from "@/content/site";

/**
 * Portrait dans un cartouche de plan. Sans photo fournie, le cartouche affiche les initiales.
 * La hauteur dépend de la variante et du point de rupture (styles/ajouts.css).
 */
export function Frame({ feuille, variante }: { feuille: string; variante: "accueil" | "apropos" }) {
  return (
    <figure className={`pa-frame pa-frame--${variante}`}>
      {site.portrait ? (
        <Image
          className="pa-frame-media"
          src={site.portrait}
          alt={`Portrait de ${site.nom}`}
          width={720}
          height={840}
          priority
          sizes="(max-width: 767px) 160px, 360px"
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
