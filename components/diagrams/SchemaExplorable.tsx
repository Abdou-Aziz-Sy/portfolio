"use client";

import { useEffect, useRef, useState } from "react";
import { DiagramScroller } from "@/components/DiagramScroller";
import {
  EXPLICATIONS_UGB,
  ID_CONSIGNE_UGB,
  NOEUDS_UGB,
  UgbLinkDiagram,
  idExplicationUgb,
  type NoeudUgb,
} from "@/components/diagrams/UgbLinkDiagram";

/** Le `[data-noeud]` le plus proche d'un nœud du DOM (l'élément lui-même ou un ancêtre), ou `null`
 *  si l'événement ne provient d'aucun bloc (fond du schéma, espace entre les blocs…). */
function noeudLePlusProche(cible: EventTarget | null): NoeudUgb | null {
  if (!(cible instanceof Element)) return null;
  return cible.closest("[data-noeud]")?.getAttribute("data-noeud") as NoeudUgb | null;
}

/**
 * Schéma explorable d'UGB Link (chantier 3, tâche 4) : au survol ou au clavier, un bloc
 * allume ses flux et ses voisins (calculés depuis `SEGMENTS_UGB`, dans `UgbLinkDiagram`),
 * estompe le reste, et son explication est mise en avant dans la liste sous le schéma.
 *
 * État entièrement déclaratif (ronde de correction 1) : `survol`, `selection` et `focalise`
 * (tabindex itinérant) vivent ici, dans le composant client, mais ne sont JAMAIS écrits sur le
 * DOM à la main — ils sont passés en props à `UgbLinkDiagram`, qui calcule lui-même
 * `data-actif`/`aria-pressed`/`data-allume`/`tabIndex` à chaque rendu. Le rendu serveur (et le
 * premier rendu client, avant toute interaction) reste ainsi complet, lisible et strictement
 * identique des deux côtés : sans JavaScript, `survol`/`selection` valent `null`, `focalise`
 * vaut sa valeur initiale (le premier bloc) — aucun état « estompé », aucune divergence
 * d'hydratation.
 */
export function SchemaExplorable() {
  const racineRef = useRef<HTMLDivElement>(null);
  const [survol, setSurvol] = useState<NoeudUgb | null>(null);
  const [selection, setSelection] = useState<NoeudUgb | null>(null);
  // Tabindex itinérant : un seul bloc dans l'ordre de tabulation à la fois. Initialisé au
  // premier bloc (identique au rendu serveur), déplacé par les flèches/Entrée/Espace/clic —
  // jamais réinitialisé par Échap ou par la désélection, qui ne concernent que `selection`.
  const [focalise, setFocalise] = useState<NoeudUgb>(NOEUDS_UGB[0]);
  // La sélection persistante l'emporte sur le survol passager.
  const actif = selection ?? survol;

  // Échap réinitialise la sélection et le survol, où que soit le focus dans la page.
  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelection(null);
      setSurvol(null);
    };
    document.addEventListener("keydown", surEchap);
    return () => document.removeEventListener("keydown", surEchap);
  }, []);

  // Clic en dehors du schéma : ne réinitialise qu'une sélection existante, et l'écouteur
  // n'est donc installé (et retiré) que lorsqu'il y a effectivement une sélection à défaire.
  useEffect(() => {
    if (!selection) return;
    const surClicExterieur = (e: MouseEvent) => {
      if (racineRef.current?.contains(e.target as Node)) return;
      setSelection(null);
    };
    document.addEventListener("click", surClicExterieur);
    return () => document.removeEventListener("click", surClicExterieur);
  }, [selection]);

  /** Déplace le focus DOM réel vers un bloc : le tabindex itinérant ne fait que désigner
   *  l'arrêt de tabulation, il ne déplace pas le focus lui-même — `.focus()` fonctionne aussi
   *  sur un élément à `tabIndex=-1`. Le `onFocus` délégué ci-dessous met alors le survol à jour. */
  function focaliserBloc(id: NoeudUgb) {
    setFocalise(id);
    racineRef.current?.querySelector<SVGGElement>(`[data-noeud="${id}"]`)?.focus();
  }

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
            if (!id) return;
            setSelection((cur) => (cur === id ? null : id));
            setFocalise(id);
          }}
          onKeyDown={(e) => {
            const id = noeudLePlusProche(e.target);
            if (!id) return;

            if (e.key === "Enter" || e.key === " ") {
              // Empêche le défilement de la page sur Espace ; `<g role="button">` n'a,
              // contrairement à un vrai bouton, aucune activation clavier native à laisser faire.
              e.preventDefault();
              setSelection((cur) => (cur === id ? null : id));
              setFocalise(id);
              return;
            }

            const index = NOEUDS_UGB.indexOf(id);
            let cible: NoeudUgb | undefined;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") cible = NOEUDS_UGB[index + 1];
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp") cible = NOEUDS_UGB[index - 1];
            else if (e.key === "Home") cible = NOEUDS_UGB[0];
            else if (e.key === "End") cible = NOEUDS_UGB[NOEUDS_UGB.length - 1];
            if (!cible) return;
            e.preventDefault();
            focaliserBloc(cible);
          }}
        >
          <UgbLinkDiagram explorable actif={actif} selection={selection} focalise={focalise} />
        </div>
      </DiagramScroller>
      <p id={ID_CONSIGNE_UGB} className="pa-small" style={{ marginTop: 8 }}>
        Flèches pour parcourir les blocs, Entrée pour sélectionner.
      </p>
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
