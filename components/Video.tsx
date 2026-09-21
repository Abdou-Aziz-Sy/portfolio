"use client";

import { useEffect, useRef } from "react";

/**
 * Démonstration filmée, muette et en boucle. Elle démarre seule quand elle entre à l'écran et
 * s'arrête quand elle en sort, sauf si l'utilisateur a demandé moins d'animations : elle attend
 * alors qu'il la lance. `preload="none"` : rien n'est téléchargé avant qu'elle soit utile.
 */
export function Video({ src, poster, titre, largeur, hauteur }: { src: string; poster: string; titre: string; largeur: number; hauteur: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    observateur.observe(video);
    return () => observateur.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="pa-video"
      src={src}
      poster={poster}
      width={largeur}
      height={hauteur}
      aria-label={titre}
      muted
      loop
      playsInline
      controls
      preload="none"
    />
  );
}
