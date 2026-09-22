"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Démonstration filmée, muette et en boucle. Elle démarre seule quand elle entre à l'écran et
 * s'arrête quand elle en sort, sauf si l'utilisateur a demandé moins d'animations : elle attend
 * alors qu'il la lance. `preload="none"` : rien n'est téléchargé avant qu'elle soit utile.
 *
 * L'affiche non plus : un attribut `poster` présent dans le HTML part au chargement de la page,
 * même loin sous la ligne de flottaison. Mesuré par PageSpeed (mobile, 4G lente), elle disputait
 * la bande passante aux polices du titre, l'élément LCP. Elle n'est donc posée qu'à l'approche de
 * la vidéo ; `width`/`height` réservent la place en attendant, sans décalage de mise en page.
 */
export function Video({ src, poster, titre, largeur, hauteur }: { src: string; poster: string; titre: string; largeur: number; hauteur: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [affiche, setAffiche] = useState<string | undefined>(undefined);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const approche = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        setAffiche(poster);
        approche.disconnect();
      },
      { rootMargin: "600px 0px" },
    );
    approche.observe(video);
    return () => approche.disconnect();
  }, [poster]);

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
      poster={affiche}
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
