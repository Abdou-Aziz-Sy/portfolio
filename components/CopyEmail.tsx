"use client";

import { useState } from "react";
import { site } from "@/content/site";

type Etat = "repos" | "copie" | "echec";

export function CopyEmail() {
  const [etat, setEtat] = useState<Etat>("repos");

  async function copier() {
    try {
      await navigator.clipboard.writeText(site.email);
      setEtat("copie");
    } catch {
      setEtat("echec");
    }
    setTimeout(() => setEtat("repos"), 2000);
  }

  const libelle = etat === "copie" ? "Copié" : etat === "echec" ? "Copie impossible" : "Copier";

  return (
    <span className="pa-copymail">
      <a href={`mailto:${site.email}`}>{site.email}</a>
      <button type="button" className="pa-menu" onClick={copier}>
        {libelle}
      </button>
      <span className="pa-sr" role="status" aria-live="polite">
        {etat === "copie" ? "Adresse copiée" : etat === "echec" ? "Copie impossible, sélectionnez l'adresse" : ""}
      </span>
    </span>
  );
}
