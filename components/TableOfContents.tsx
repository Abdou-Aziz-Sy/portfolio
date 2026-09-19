"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import type { Section } from "@/lib/content";

export function TableOfContents({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState<string | null>(null);

  // Section en cours : le dernier titre passé au-dessus du tiers haut de l'écran. Recalculé à
  // chaque défilement (une fois par image) plutôt que par IntersectionObserver, qui ne voit pas
  // les titres sautés lors d'un défilement rapide ou d'un lien vers un ancre.
  useEffect(() => {
    const titres = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (titres.length === 0) return;
    let image = 0;
    const mettreAJour = () => {
      image = 0;
      const seuil = window.innerHeight * 0.35;
      const passes = titres.filter((t) => t.getBoundingClientRect().top <= seuil);
      setActive(passes.length > 0 ? passes[passes.length - 1].id : null);
    };
    const surDefilement = () => {
      if (!image) image = requestAnimationFrame(mettreAJour);
    };
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement);
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
    };
  }, [sections]);

  return (
    <nav className="pa-toc" aria-label="Sommaire">
      <span className="pa-meta">Sommaire</span>
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}>
              <span>{s.numero}</span>
              {s.titre}
            </a>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 28 }}>
        <a className="pa-btn pa-btn--secondary pa-btn--sm" href={site.cv.href} download={site.cv.fichier}>
          Télécharger le CV
        </a>
      </div>
    </nav>
  );
}
