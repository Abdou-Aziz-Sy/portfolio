import { site } from "@/content/site";

/**
 * Pastille de disponibilité : un point vert statique (jamais animé, voir la règle
 * `.pa-dot.is-dispo` dans `styles/ajouts.css`) suivi du texte de disponibilité.
 * Utilisée à l'identique à l'accueil, à propos et dans le pied de page, pour éviter
 * qu'un des trois emplacements n'oublie la classe `is-dispo` qui stoppe la pulsation.
 */
export function Disponibilite({ texte = site.disponibilite }: { texte?: string }) {
  return (
    <span className="pa-st-ok">
      <span className="pa-dot is-dispo" />
      {texte}
    </span>
  );
}
