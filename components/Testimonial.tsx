import Image from "next/image";
import type { Recommandation } from "@/content/site";

export function Testimonial({ recommandation }: { recommandation: Recommandation }) {
  return (
    <figure className="pa-surface pa-quote-card">
      <blockquote>{recommandation.citation}</blockquote>
      <figcaption className="pa-who">
        {recommandation.photo ? (
          <Image src={recommandation.photo} alt="" width={48} height={48} style={{ borderRadius: "50%" }} />
        ) : (
          <span className="pa-avatar" aria-hidden="true" />
        )}
        <span>
          <b style={{ display: "block", fontWeight: 600 }}>{recommandation.nom}</b>
          <span className="pa-small">{recommandation.fonction}</span>
        </span>
      </figcaption>
    </figure>
  );
}
