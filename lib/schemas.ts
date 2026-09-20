import { z } from "zod";
import { categories } from "@/lib/categories";
import { iconKeys } from "@/lib/icons";

export { categories, categorieLabel, type Categorie } from "@/lib/categories";

export const statutLabel = {
  "en-production": "En production",
  "en-cours": "En cours",
  termine: "Terminé",
} as const;
export type Statut = keyof typeof statutLabel;

const boite = z.object({ titre: z.string().min(1), sous: z.string() });

export const ligneStatutSchema = z.object({
  service: z.string().min(1),
  detail: z.string().default(""),
  etat: z.enum(["en production", "opérationnel"]),
});
export type LigneStatut = z.infer<typeof ligneStatutSchema>;

export const projetSchema = z.object({
  titre: z.string().min(1),
  accroche: z.string().min(1),
  resume: z.string().min(1),
  dossier: z.number().int().positive(),
  annee: z.number().int(),
  statut: z.enum(["en-production", "en-cours", "termine"]),
  cadre: z.string().min(1),
  categories: z.array(z.enum(categories)).min(1),
  stack: z.array(z.enum(iconKeys)),
  stackLibelles: z.array(z.string()).optional(),
  libelles: z.record(z.string(), z.string()).optional(),
  role: z.string().optional(),
  periode: z.string().optional(),
  stackDetail: z.string().optional(),
  misEnAvant: z.boolean().default(false),
  lignesStatut: z.array(ligneStatutSchema).optional(),
  miniSchema: z.tuple([boite, boite, boite]),
  depot: z.url().optional(),
  demo: z.url().optional(),
  publie: z.boolean(),
});
export type ProjetMeta = z.infer<typeof projetSchema>;

export const articleSchema = z.object({
  titre: z.string().min(1),
  chapo: z.string().min(1),
  date: z.coerce.date(),
  etiquettes: z.array(z.string()),
  projetLie: z.string().optional(),
  publie: z.boolean(),
});
export type ArticleMeta = z.infer<typeof articleSchema>;
