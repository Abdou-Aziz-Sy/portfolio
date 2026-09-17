"use client";

import { useEffect, useId, useState } from "react";
import { NavLinks, type LienNav } from "@/components/NavLinks";

export function MobileMenu({ liens }: { liens: LienNav[] }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  const fermer = () => setOuvert(false);

  return (
    <div className="pa-mobile-only">
      <button
        type="button"
        className="pa-menu"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert((v) => !v)}
      >
        {ouvert ? "Fermer" : "Menu"}
      </button>
      <div id={id} className="pa-menu-panel" hidden={!ouvert}>
        <nav aria-label="Principale (mobile)">
          <NavLinks liens={liens} onNavigate={fermer} />
          <a href="#contact" onClick={fermer}>
            Me contacter
          </a>
        </nav>
      </div>
    </div>
  );
}
