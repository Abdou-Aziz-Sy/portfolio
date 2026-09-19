"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { flushSync } from "react-dom";

type Theme = "dark" | "light";

const abonnes = new Set<() => void>();

// Classe posée sur `<html>` UNIQUEMENT pendant la transition de vue de la bascule de thème
// (voir styles/mouvement.css) : elle restreint aux JavaScript-driven la neutralisation du fondu
// par défaut de `::view-transition-old(root)`/`::view-transition-new(root)`, sans toucher au
// fondu de page géré par React lors d'une navigation (ex. carte → étude, tâche 5), qui cible le
// même pseudo-élément `root` en dehors de toute bascule de thème.
const CLASSE_TRANSITION_THEME = "pa-transition-theme";

// Référence à la transition de vue de thème EN COURS (module-level, pas un `useRef` : un seul
// bouton de thème existe dans l'arbre, mais document.startViewTransition est de toute façon une
// notion globale au document — deux instances du composant partageraient la même transition du
// navigateur). Sert à distinguer, dans le rappel de `finished` (voir `basculer`), la transition
// qui se termine réellement de celle qu'un clic ultérieur a fait annuler.
let transitionThemeCourante: ViewTransition | null = null;

function lireTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(sAbonner, lireTheme, () => "dark");

  function ecrireTheme(suivant: Theme) {
    document.documentElement.dataset.theme = suivant;
    try {
      localStorage.setItem("theme", suivant);
    } catch {
      // Stockage indisponible : le thème s'applique pour la visite en cours.
    }
    abonnes.forEach((rappel) => rappel());
  }

  function basculer(evenement: MouseEvent<HTMLButtonElement>) {
    const suivant: Theme = theme === "dark" ? "light" : "dark";
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Sans prise en charge de l'API ou mouvement réduit : bascule instantanée (comportement
    // d'origine). Le mouvement réduit est vérifié au moment du clic, pas une fois pour toutes :
    // l'utilisateur peut changer ce réglage système entre deux bascules.
    if (!document.startViewTransition || reduit) {
      ecrireTheme(suivant);
      return;
    }

    // Centre du bouton cliqué et rayon jusqu'au coin le plus éloigné de l'écran : calculés avant
    // le déclenchement de la transition, la position du bouton ne change pas pendant celle-ci.
    const rect = evenement.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const rayon = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    document.documentElement.classList.add(CLASSE_TRANSITION_THEME);

    const transition = document.startViewTransition(() => {
      // `flushSync` : la capture de l'instantané « après » a lieu à la fin de ce rappel. L'écriture
      // de `data-theme` sur le document est synchrone et donc déjà visible, mais le libellé et
      // l'icône du bouton dépendent d'un rendu React déclenché par la notification des abonnés
      // (useSyncExternalStore) — sans `flushSync`, ce rendu serait différé après la capture, et
      // l'instantané « après » montrerait encore l'ancien libellé.
      flushSync(() => {
        ecrireTheme(suivant);
      });
    });
    transitionThemeCourante = transition;

    // Gestionnaire de rejet passé en second argument de `.then()`, jamais en `.catch()` séparé :
    // ce dernier rattraperait AUSSI une exception levée par le premier gestionnaire lui-même (ex.
    // un rejet de `animate()`), la faisant disparaître silencieusement. Ici, seul un rejet de
    // `transition.ready` (ex. transition annulée par le navigateur, cf. plus bas) est concerné —
    // le thème est de toute façon déjà appliqué, seul le cercle n'aura pas joué ; toute autre
    // erreur doit remonter normalement.
    transition.ready.then(
      () => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rayon}px at ${x}px ${y}px)`] },
          { duration: 450, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
        );
      },
      () => {},
    );

    transition.finished.finally(() => {
      // Un second clic pendant les 450 ms annule CETTE transition (le navigateur en résout le
      // `finished` presque aussitôt) et en démarre une autre, qui devient `transitionThemeCourante`.
      // Sans ce contrôle, ce rappel retirerait la classe alors que la nouvelle transition tourne
      // encore, et le fondu par défaut du navigateur réapparaîtrait en plein cercle.
      if (transitionThemeCourante === transition) {
        document.documentElement.classList.remove(CLASSE_TRANSITION_THEME);
        transitionThemeCourante = null;
      }
    });
  }

  const texteVisible = theme === "dark" ? "Papier" : "Nuit";
  const cible: Theme = theme === "dark" ? "light" : "dark";
  const nomCible = cible === "light" ? "Thème clair" : "Thème sombre";
  // Le nom accessible reprend le texte visible sur bureau (WCAG 2.5.3 : quand un texte
  // est visible sur le contrôle, le nom accessible doit le contenir) et reste compris
  // sur mobile, où le texte est masqué et seule l'icône est visible.
  const nomAccessible = `${texteVisible} — ${nomCible}`;

  return (
    <button
      type="button"
      className="pa-menu pa-theme"
      onClick={basculer}
      aria-label={nomAccessible}
      title={nomCible}
      data-testid="theme-toggle"
    >
      <span className="pa-theme-texte" aria-hidden="true">
        {texteVisible}
      </span>
      <svg className="pa-theme-icone" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
