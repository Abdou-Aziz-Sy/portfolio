"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NavLinks, type LienNav } from "@/components/NavLinks";

export function MobileMenu({ liens }: { liens: LienNav[] }) {
  const [ouvert, setOuvert] = useState(false);
  const id = useId();
  const boutonRef = useRef<HTMLButtonElement>(null);
  const conteneurRef = useRef<HTMLDivElement>(null);

  const fermerEtRendreFocus = useCallback(() => {
    setOuvert(false);
    boutonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermerEtRendreFocus();
    };
    const surClic = (e: PointerEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) setOuvert(false);
    };
    window.addEventListener("keydown", surTouche);
    document.addEventListener("pointerdown", surClic);
    return () => {
      window.removeEventListener("keydown", surTouche);
      document.removeEventListener("pointerdown", surClic);
    };
  }, [ouvert, fermerEtRendreFocus]);

  const fermer = () => setOuvert(false);

  return (
    <div className="pa-mobile-only" ref={conteneurRef}>
      <button
        type="button"
        ref={boutonRef}
        className="pa-menu"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert((v) => !v)}
      >
        Menu
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
