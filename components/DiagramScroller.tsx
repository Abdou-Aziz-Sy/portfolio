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
  // Un redimensionnement peut faire repasser `deborde` à faux pendant que le cadre a le focus
  // (au clavier, après défilement) : lui retirer tabIndex à cet instant chasserait le focus vers
  // le document sans avertir l'utilisateur. On ne retire le focalisable qu'au blur, une fois le
  // cadre effectivement quitté.
  const [aLeFocus, setALeFocus] = useState(false);

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

  const focalisable = deborde || aLeFocus;

  return (
    <div className="pa-schema-cadre">
      <div
        ref={ref}
        className="pa-diagram-scroll"
        data-testid="schema-defilant"
        data-deborde={deborde ? "true" : "false"}
        tabIndex={focalisable ? 0 : undefined}
        role={focalisable ? "region" : undefined}
        aria-label={focalisable ? label : undefined}
        onFocus={() => setALeFocus(true)}
        onBlur={() => setALeFocus(false)}
      >
        {children}
      </div>
      <span className="pa-schema-indice" data-testid="indice-defilement" aria-hidden="true" hidden={!deborde || finAtteinte}>
        →
      </span>
    </div>
  );
}
