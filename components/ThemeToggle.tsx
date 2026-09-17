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

  return (
    <button
      type="button"
      className="pa-menu"
      onClick={basculer}
      aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
      data-testid="theme-toggle"
    >
      {theme === "dark" ? "Papier" : "Nuit"}
    </button>
  );
}
