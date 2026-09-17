"use client";

import { useEffect, useState } from "react";
import type { Section } from "@/lib/content";

export function TableOfContents({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const titres = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (titres.length === 0) return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" },
    );
    titres.forEach((t) => observateur.observe(t));
    return () => observateur.disconnect();
  }, [sections]);

  return (
    <nav className="pa-toc" aria-label="Sommaire">
      <span className="pa-meta">Sommaire</span>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>
              <span>{s.numero}</span>
              {s.titre}
            </a>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 28 }}>
        <a className="pa-btn pa-btn--secondary pa-btn--sm" href="/cv.pdf" download>
          Télécharger le CV
        </a>
      </div>
    </nav>
  );
}
