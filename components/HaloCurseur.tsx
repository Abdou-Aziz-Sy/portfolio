"use client";

import { useEffect, useRef } from "react";

/**
 * La grille du plan s'allume sous le pointeur, sur la première vue de l'accueil.
 *
 * Le calque est positionné en absolu sans ancêtre positionné : son repère est donc celui du
 * document, le même que la grille de fond (.pa-ground, propagée au canevas). Les deux grilles
 * se superposent ainsi au pixel près, sans calcul de décalage. Il couvre le document depuis le
 * haut jusqu'au bas de `cible` ; sa hauteur suit les redimensionnements.
 *
 * Seuls une souris ou un stylet l'activent (jamais le tactile), et rien n'est branché si
 * l'utilisateur a demandé moins d'animations. Un seul `requestAnimationFrame` par image : les
 * `pointermove`, plus fréquents que l'affichage, ne font que noter la dernière position.
 */
export function HaloCurseur({ cible }: { cible: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const halo = ref.current;
    const zone = document.querySelector<HTMLElement>(cible);
    if (!halo || !zone) return;

    const mesurer = () => {
      halo.style.height = `${zone.getBoundingClientRect().bottom + window.scrollY}px`;
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(zone);

    const permis = matchMedia("(hover: hover) and (pointer: fine)");
    const sobre = matchMedia("(prefers-reduced-motion: reduce)");
    if (!permis.matches || sobre.matches) return () => observateur.disconnect();

    let image = 0;
    let x = 0;
    let y = 0;
    let actif = false;
    const peindre = () => {
      image = 0;
      halo.style.setProperty("--x", `${x}px`);
      halo.style.setProperty("--y", `${y}px`);
      halo.dataset.actif = actif ? "1" : "0";
    };
    const surMouvement = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY + window.scrollY;
      actif = y <= halo.offsetHeight;
      if (!image) image = requestAnimationFrame(peindre);
    };
    const surSortie = () => {
      actif = false;
      if (!image) image = requestAnimationFrame(peindre);
    };

    window.addEventListener("pointermove", surMouvement, { passive: true });
    document.documentElement.addEventListener("pointerleave", surSortie);
    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
      window.removeEventListener("pointermove", surMouvement);
      document.documentElement.removeEventListener("pointerleave", surSortie);
    };
  }, [cible]);

  return <div ref={ref} className="pa-halo" data-testid="halo-curseur" data-actif="0" aria-hidden="true" />;
}
