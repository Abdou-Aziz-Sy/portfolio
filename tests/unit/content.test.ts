import { afterEach, describe, expect, it } from "vitest";
import path from "node:path";
import { extraireSections, getArticle, getArticles, getProjet, getProjets } from "@/lib/content";

const racine = path.join(__dirname, "../fixtures/content");
const projets = path.join(racine, "projets");
const blog = path.join(racine, "blog");

describe("getProjets", () => {
  it("exclut les brouillons et trie par numéro de dossier", () => {
    expect(getProjets(projets).map((p) => p.slug)).toEqual(["alpha", "beta"]);
  });
  it("expose le slug, le corps et les sections", () => {
    const alpha = getProjet("alpha", projets);
    expect(alpha?.misEnAvant).toBe(true);
    expect(alpha?.libelles).toEqual({ nodedotjs: "Serveur" });
    expect(alpha?.sections.map((s) => s.id)).toEqual(["contexte", "ce-que-je-referais-autrement"]);
  });
  it("ne renvoie pas un brouillon", () => expect(getProjet("brouillon", projets)).toBeUndefined());
  it("signale un frontmatter invalide avec le nom du fichier", () => {
    expect(() => getProjets(path.join(racine, "invalide/projets"))).toThrow(/casse\.mdx/);
  });
});

describe("getArticles", () => {
  it("exclut les brouillons et trie du plus récent au plus ancien", () => {
    expect(getArticles(blog).map((a) => a.slug)).toEqual(["recent", "ancien"]);
  });
  it("calcule le temps de lecture", () => expect(getArticle("recent", blog)?.minutes).toBe(1));
  it("ne renvoie pas un brouillon", () => expect(getArticle("cache", blog)).toBeUndefined());
});

describe("aperçu des brouillons", () => {
  afterEach(() => {
    delete process.env.AFFICHER_BROUILLONS;
    delete process.env.VERCEL_ENV;
  });
  it("inclut les brouillons quand AFFICHER_BROUILLONS=1", () => {
    process.env.AFFICHER_BROUILLONS = "1";
    expect(getArticles(blog).map((a) => a.slug)).toContain("cache");
  });
  it("les ignore toujours en production Vercel", () => {
    process.env.AFFICHER_BROUILLONS = "1";
    process.env.VERCEL_ENV = "production";
    expect(getArticles(blog).map((a) => a.slug)).not.toContain("cache");
  });
});

describe("extraireSections", () => {
  it("numérote les titres de niveau 2 et en fait des identifiants sans accents", () => {
    expect(extraireSections("## Contexte\ntexte\n### Détail\n## Décisions prises")).toEqual([
      { id: "contexte", numero: "01", titre: "Contexte" },
      { id: "decisions-prises", numero: "02", titre: "Décisions prises" },
    ]);
  });
  it("ignore les titres dans les blocs de code", () => {
    expect(extraireSections("```\n## Pas un titre\n```\n## Vrai")).toHaveLength(1);
  });
});
