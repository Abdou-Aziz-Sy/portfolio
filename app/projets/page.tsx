import type { Metadata } from "next";
import { Suspense } from "react";
import { getProjets } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectGrid, ProjectGridStatique } from "@/components/ProjectGrid";

export const metadata: Metadata = {
  title: "Projets",
  description: "Chaque dossier décrit un système : ce qu'il fait, comment il est construit et où il en est.",
  alternates: { canonical: "/projets" },
};

export default function PageProjets() {
  const cartes = getProjets().map((p) => ({
    slug: p.slug,
    categories: p.categories,
    carte: <ProjectCard projet={p} />,
  }));

  return (
    <>
      <section className="pa-wrap" style={{ paddingTop: 88, paddingBottom: 48 }}>
        <span className="pa-meta">Index des dossiers</span>
        <h1 className="pa-hero pa-hero-xl pa-rise" style={{ marginTop: 12 }}>
          Projets<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p className="pa-lead pa-muted" style={{ marginTop: 16, maxWidth: "52ch" }}>
          Chaque dossier décrit un système : ce qu&apos;il fait, comment il est construit et où il en est.
        </p>
      </section>
      <div className="pa-wrap" style={{ paddingBottom: 120 }}>
        <Suspense fallback={<ProjectGridStatique cartes={cartes} />}>
          <ProjectGrid cartes={cartes} />
        </Suspense>
      </div>
    </>
  );
}
