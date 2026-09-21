"use client";

import Image from "next/image";
import { useRef } from "react";

export type CaptureProps = {
  src: string;
  alt: string;
  legende: string;
  largeur: number;
  hauteur: number;
  /** Largeur affichée sur grand écran, pour que Next choisisse la bonne variante. */
  sizes?: string;
};

/**
 * Capture d'écran d'un projet, cliquable pour l'agrandir dans un `<dialog>` natif : Échap le
 * ferme, et le navigateur rend le focus au bouton qui l'a ouvert. Un clic sur le fond (le
 * `<dialog>` lui-même, pas son contenu) ferme aussi. L'image agrandie ne se charge qu'à
 * l'ouverture : un dialogue fermé n'est pas affiché, donc son image différée n'est pas demandée.
 */
export function Capture({ src, alt, legende, largeur, hauteur, sizes = "(max-width: 767px) 100vw, 760px" }: CaptureProps) {
  const dialogue = useRef<HTMLDialogElement>(null);
  return (
    <figure className="pa-capture" data-testid="capture">
      <button
        type="button"
        className="pa-capture-bouton"
        aria-label={`Agrandir : ${alt}`}
        onClick={() => dialogue.current?.showModal()}
      >
        <Image src={src} alt={alt} width={largeur} height={hauteur} sizes={sizes} />
      </button>
      <figcaption className="pa-small">{legende}</figcaption>
      <dialog
        ref={dialogue}
        className="pa-capture-dialogue"
        aria-label={alt}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <Image src={src} alt={alt} width={largeur} height={hauteur} sizes="100vw" quality={90} />
        <form method="dialog">
          <button type="submit" className="pa-capture-fermer" aria-label="Fermer l'agrandissement">
            ×
          </button>
        </form>
      </dialog>
    </figure>
  );
}
