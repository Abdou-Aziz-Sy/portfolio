import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { articleSchema, projetSchema, type ArticleMeta, type ProjetMeta } from "@/lib/schemas";
import { tempsDeLecture } from "@/lib/reading-time";
import { slugifier } from "@/lib/slug";

export type Section = { id: string; numero: string; titre: string };
export type Projet = ProjetMeta & { slug: string; corps: string; sections: Section[] };
export type Article = ArticleMeta & { slug: string; corps: string; minutes: number };

const CONTENU = path.join(process.cwd(), "content");

export function extraireSections(corps: string): Section[] {
  const sections: Section[] = [];
  let dansCode = false;
  for (const ligne of corps.split(/\r?\n/)) {
    if (ligne.trimStart().startsWith("```")) dansCode = !dansCode;
    if (dansCode) continue;
    const m = /^##\s+(.+?)\s*$/.exec(ligne);
    if (m) {
      sections.push({
        id: slugifier(m[1]),
        numero: String(sections.length + 1).padStart(2, "0"),
        titre: m[1],
      });
    }
  }
  return sections;
}

function lireDossier<T>(dossier: string, schema: z.ZodType<T>) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier)
    .filter((f) => f.endsWith(".mdx"))
    .map((fichier) => {
      const { data, content } = matter(readFileSync(path.join(dossier, fichier), "utf8"));
      const resultat = schema.safeParse(data);
      if (!resultat.success) {
        throw new Error(`Contenu invalide dans ${fichier} : ${resultat.error.message}`);
      }
      return { slug: fichier.replace(/\.mdx$/, ""), meta: resultat.data, corps: content };
    });
}

export function getProjets(dossier = path.join(CONTENU, "projets")): Projet[] {
  return lireDossier(dossier, projetSchema)
    .filter(({ meta }) => meta.publie)
    .map(({ slug, meta, corps }) => ({ ...meta, slug, corps, sections: extraireSections(corps) }))
    .sort((a, b) => a.dossier - b.dossier);
}

export function getProjet(slug: string, dossier?: string): Projet | undefined {
  return getProjets(dossier).find((p) => p.slug === slug);
}

export function getArticles(dossier = path.join(CONTENU, "blog")): Article[] {
  return lireDossier(dossier, articleSchema)
    .filter(({ meta }) => meta.publie)
    .map(({ slug, meta, corps }) => ({ ...meta, slug, corps, minutes: tempsDeLecture(corps) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getArticle(slug: string, dossier?: string): Article | undefined {
  return getArticles(dossier).find((a) => a.slug === slug);
}
