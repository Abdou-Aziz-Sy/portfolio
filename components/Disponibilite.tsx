import { site } from "@/content/site";

/**
 * Pastille de disponibilité : un point vert statique (la pulsation de plan.css est coupée
 * pour toutes les pastilles dans `styles/mouvement.css`) suivi du texte de disponibilité.
 * Utilisée à l'identique à l'accueil, à propos et dans le pied de page.
 */
export function Disponibilite({ texte = site.disponibilite }: { texte?: string }) {
  return (
    <span className="pa-st-ok">
      <span className="pa-dot is-dispo" />
      {texte}
    </span>
  );
}
