"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const abonnes = new Set<() => void>();

function lireTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(sAbonner, lireTheme, () => "dark");

  function basculer() {
    const suivant: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = suivant;
    try {
      localStorage.setItem("theme", suivant);
    } catch {
      // Stockage indisponible : le thème s'applique pour la visite en cours.
    }
    abonnes.forEach((rappel) => rappel());
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
