import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/content";
import { ArticleList } from "@/components/ArticleList";

export const metadata: Metadata = {
  title: "Blog",
  description: "Retours d'expérience techniques : backend, architecture, exploitation et IA appliquée.",
  alternates: { canonical: "/blog" },
};

export default function PageBlog() {
  const articles = getArticles();
  if (articles.length === 0) notFound();

  return (
    <>
      <section className="pa-wrap" style={{ paddingTop: 88, paddingBottom: 48 }}>
        <span className="pa-meta">Carnet de bord</span>
        <h1 className="pa-hero pa-hero-xl pa-rise" style={{ marginTop: 12 }}>
          Blog<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p className="pa-lead pa-muted" style={{ marginTop: 16, maxWidth: "52ch" }}>
          Ce que j&apos;apprends en construisant : les choix techniques, leurs raisons et leurs limites.
        </p>
      </section>
      <div className="pa-wrap" style={{ paddingBottom: 120 }}>
        <ArticleList articles={articles} />
      </div>
    </>
  );
}
