import { categories, type Categorie } from "@/lib/categories";

export function lireCategorie(valeur: string | null | undefined): Categorie | null {
  return (categories as readonly string[]).includes(valeur ?? "") ? (valeur as Categorie) : null;
}

export function filtrerProjets<T extends { categories: readonly string[] }>(
  projets: T[],
  categorie: string | null,
): T[] {
  return categorie ? projets.filter((p) => p.categories.includes(categorie)) : projets;
}
