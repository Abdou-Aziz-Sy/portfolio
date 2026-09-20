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
          priority
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
