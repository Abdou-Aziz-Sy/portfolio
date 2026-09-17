import { describe, expect, it } from "vitest";
import { filtrerProjets, lireCategorie } from "@/lib/filters";

const projets = [
  { slug: "a", categories: ["backend", "infrastructure"] },
  { slug: "b", categories: ["full-stack"] },
];

describe("filtrerProjets", () => {
  it("renvoie tout sans catégorie", () => expect(filtrerProjets(projets, null)).toHaveLength(2));
  it("filtre par catégorie", () => expect(filtrerProjets(projets, "backend").map((p) => p.slug)).toEqual(["a"]));
});

describe("lireCategorie", () => {
  it("accepte une catégorie connue", () => expect(lireCategorie("ia")).toBe("ia"));
  it("rejette une valeur inconnue", () => expect(lireCategorie("cobol")).toBeNull());
  it("rejette l'absence de valeur", () => expect(lireCategorie(undefined)).toBeNull());
});
