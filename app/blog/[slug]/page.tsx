import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { extraireSections, getArticle, getArticles, getProjet } from "@/lib/content";
import { dateIso } from "@/components/ArticleList";
import { composantsMdx } from "@/components/mdx";
import { numeroDossier } from "@/components/ProjectCard";
import { ProgressionLecture } from "@/components/ProgressionLecture";
import { MetaLine } from "@/components/StatusMeta";
import { TextTags } from "@/components/Tags";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.titre,
    description: article.chapo,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: article.titre, description: article.chapo, type: "article", publishedTime: dateIso(article.date) },
    robots: article.publie ? undefined : { index: false, follow: false },
  };
}

export default async function PageArticle({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const projet = article.projetLie ? getProjet(article.projetLie) : undefined;

  return (
    <article className="pa-wrap pa-articlegrid">
      <ProgressionLecture />
      <aside style={{ paddingTop: 10 }}>
        <Link className="pa-link" href="/blog" style={{ fontSize: 14 }}>
          ← Tous les articles
        </Link>
        <ul className="pa-status" style={{ marginTop: 32 }}>
          <li>
            <span>publié</span>
            <span style={{ color: "var(--ink)" }}>{dateIso(article.date)}</span>
          </li>
          <li>
            <span>lecture</span>
            <span style={{ color: "var(--ink)" }}>{article.minutes} min</span>
          </li>
          {projet ? (
            <li>
              <span>dossier</span>
              <span style={{ color: "var(--ink)" }}>{String(projet.dossier).padStart(2, "0")}</span>
            </li>
          ) : null}
        </ul>
      </aside>

      <div>
        {!article.publie ? (
          <p className="pa-todo" style={{ marginBottom: 16 }}>
            Brouillon — non publié
          </p>
        ) : null}
        <span className="pa-meta">Blog / {article.slug}</span>
        <h1 className="pa-h1" style={{ marginTop: 14 }}>
          {article.titre}
        </h1>
        <p className="pa-lead pa-muted" style={{ marginTop: 16 }}>
          {article.chapo}
        </p>
        <div className="pa-articlebar">
          <span className="pa-meta">
            <MetaLine parties={[dateIso(article.date), `${article.minutes} min de lecture`]} />
          </span>
          <TextTags items={article.etiquettes} />
        </div>
        <div className="pa-prose">
          <MDXRemote
            source={article.corps}
            components={composantsMdx(extraireSections(article.corps))}
            options={{ blockJS: false, blockDangerousJS: true }}
          />
        </div>
        {projet ? (
          <Link
            href={`/projets/${projet.slug}`}
            className="pa-surface pa-related"
            style={{ marginTop: 40 }}
          >
            <div>
              <span className="pa-meta">Étude de cas associée</span>
              <p className="pa-h3" style={{ marginTop: 6 }}>
                {numeroDossier(projet.dossier)} — {projet.titre}
              </p>
              <p className="pa-small">{projet.accroche}</p>
            </div>
            <span className="pa-link">Lire →</span>
          </Link>
        ) : null}
      </div>
      <div />
    </article>
  );
}
