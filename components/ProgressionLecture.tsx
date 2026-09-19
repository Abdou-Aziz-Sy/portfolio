/** Fine barre de progression de lecture (tâche 8) : suit le défilement de la page via
 * `animation-timeline: scroll()` (styles/mouvement.css), sans aucun JavaScript — aucun état,
 * pas de "use client". N'apporte aucune information indispensable (la position de défilement
 * est déjà perceptible autrement) : `aria-hidden`. */
export function ProgressionLecture() {
  return <div className="pa-progression" data-testid="progression" aria-hidden="true" />;
}
