"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Cadre d'un schéma large. Sur petit écran, le schéma garde une taille lisible et défile
 * horizontalement ; un dégradé et une flèche signalent qu'il reste du contenu à droite.
 * Le cadre ne devient focalisable (pour le défilement au clavier) que s'il déborde réellement.
 */
export function DiagramScroller({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [deborde, setDeborde] = useState(false);
  const [finAtteinte, setFinAtteinte] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => {
      setDeborde(el.scrollWidth > el.clientWidth + 1);
      setFinAtteinte(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    el.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      observateur.disconnect();
      el.removeEventListener("scroll", mesurer);
    };
  }, []);

  return (
    <div className="pa-schema-cadre">
      <div
        ref={ref}
        className="pa-diagram-scroll"
        data-testid="schema-defilant"
        data-deborde={deborde ? "true" : "false"}
        tabIndex={deborde ? 0 : undefined}
        role={deborde ? "region" : undefined}
        aria-label={deborde ? label : undefined}
      >
        {children}
      </div>
      <span className="pa-schema-indice" data-testid="indice-defilement" aria-hidden="true" hidden={!deborde || finAtteinte}>
        →
      </span>
    </div>
  );
}
