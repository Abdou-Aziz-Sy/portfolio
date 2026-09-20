// Sans dépendance : importé par des composants client (ProjectGrid). lib/schemas.ts, qui importe
// Zod, ne doit jamais l'être, sinon Zod part au navigateur.
export const categories = ["backend", "full-stack", "infrastructure", "ia"] as const;
export type Categorie = (typeof categories)[number];

export const categorieLabel: Record<Categorie, string> = {
  backend: "Backend",
  "full-stack": "Full stack",
  infrastructure: "Infrastructure",
  ia: "IA appliquée",
};
