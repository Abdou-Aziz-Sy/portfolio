"use client";

import { useEffect, useRef, useState } from "react";
import { DiagramScroller } from "@/components/DiagramScroller";
import {
  EXPLICATIONS_UGB,
  NOEUDS_UGB,
  SEGMENTS_UGB,
  UgbLinkDiagram,
  idExplicationUgb,
  type NoeudUgb,
} from "@/components/diagrams/UgbLinkDiagram";

/** Un `[data-noeud]` ou `[data-flux]` le plus proche d'un nœud du DOM, ou `null`. */
function noeudLePlusProche(cible: EventTarget | null): NoeudUgb | null {
  if (!(cible instanceof Element)) return null;
  return cible.closest("[data-noeud]")?.getAttribute("data-noeud") as NoeudUgb | null;
}

/**
 * Schéma explorable d'UGB Link (chantier 3, tâche 4) : au survol ou au clavier, un bloc
 * allume ses flux et ses voisins (calculés depuis `SEGMENTS_UGB`), estompe le reste, et son
 * explication est mise en avant dans la liste sous le schéma.
 *
 * L'état (survol, sélection persistante) vit ici, dans le composant client. Le schéma
 * lui-même (`UgbLinkDiagram`) ne reçoit qu'un prop `explorable: boolean` — il pose la
 * charpente d'accessibilité statique (rôle, focalisation, nom accessible) mais ne connaît
 * pas l'état d'interaction. Cet état est donc appliqué après montage, directement sur les
 * nœuds du DOM (`data-actif`, `data-allume`, `aria-pressed`), dans un effet déclenché par les
 * changements de survol/sélection : le rendu serveur (et le premier rendu client, avant cet
 * effet) reste ainsi complet, lisible et strictement identique des deux côtés — aucun état
 * « estompé » sans JavaScript, aucune divergence d'hydratation.
 */
export function SchemaExplorable() {
  const racineRef = useRef<HTMLDivElement>(null);
  const [survol, setSurvol] = useState<NoeudUgb | null>(null);
  const [selection, setSelection] = useState<NoeudUgb | null>(null);
  // La sélection persistante l'emporte sur le survol passager.
  const actif = selection ?? survol;

  // Réinitialisation : Échap (où que soit le focus) et clic en dehors du schéma.
  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelection(null);
      setSurvol(null);
    };
    const surClicExterieur = (e: MouseEvent) => {
      if (racineRef.current?.contains(e.target as Node)) return;
      setSelection(null);
    };
    document.addEventListener("keydown", surEchap);
    document.addEventListener("click", surClicExterieur);
    return () => {
      document.removeEventListener("keydown", surEchap);
      document.removeEventListener("click", surClicExterieur);
    };
  }, []);

  // Applique l'état courant sur le DOM du schéma : voir le commentaire de tête sur la raison
  // de cette application impérative plutôt que par des props supplémentaires sur UgbLinkDiagram.
  useEffect(() => {
    const svg = racineRef.current?.querySelector("svg");
    if (!svg) return;

    if (actif) svg.setAttribute("data-actif", actif);
    else svg.removeAttribute("data-actif");

    // Un segment est allumé si sa liste `relie` contient le bloc actif (troncs partagés
    // compris, ex. api-bus) ; les blocs allumés sont l'union de ces listes — qui contient
    // toujours le bloc actif lui-même, en plus de ses voisins.
    const segmentsAllumes = actif ? SEGMENTS_UGB.filter((s) => s.relie.includes(actif)) : [];
    const idsSegmentsAllumes = new Set(segmentsAllumes.map((s) => s.id));
    const blocsAllumes = new Set(segmentsAllumes.flatMap((s) => s.relie));

    for (const g of svg.querySelectorAll<SVGGElement>("[data-flux]")) {
      const id = g.getAttribute("data-flux");
      if (id && idsSegmentsAllumes.has(id)) g.setAttribute("data-allume", "true");
      else g.removeAttribute("data-allume");
    }
    for (const g of svg.querySelectorAll<SVGGElement>("[data-noeud]")) {
      const id = g.getAttribute("data-noeud") as NoeudUgb;
      if (blocsAllumes.has(id)) g.setAttribute("data-allume", "true");
      else g.removeAttribute("data-allume");
      g.setAttribute("aria-pressed", String(selection === id));
    }
  }, [actif, selection]);

  return (
    <div ref={racineRef}>
      <DiagramScroller label="Schéma d'architecture, défilable">
        <div
          onMouseOver={(e) => setSurvol(noeudLePlusProche(e.target))}
          onMouseLeave={() => setSurvol(null)}
          onFocus={(e) => setSurvol(noeudLePlusProche(e.target))}
          onBlur={() => setSurvol(null)}
          onClick={(e) => {
            const id = noeudLePlusProche(e.target);
            if (id) setSelection((cur) => (cur === id ? null : id));
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const id = noeudLePlusProche(e.target);
            if (!id) return;
            // Empêche le défilement de la page sur Espace ; `<g role="button">` n'a, contrairement
            // à un vrai bouton, aucune activation clavier native à laisser faire.
            e.preventDefault();
            setSelection((cur) => (cur === id ? null : id));
          }}
        >
          <UgbLinkDiagram explorable />
        </div>
      </DiagramScroller>
      <dl className="pa-explications">
        {NOEUDS_UGB.map((id) => {
          const { titre, texte } = EXPLICATIONS_UGB[id];
          return (
            <div key={id} aria-current={actif === id ? "true" : undefined}>
              <dt>{titre}</dt>
              <dd id={idExplicationUgb(id)}>{texte}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
