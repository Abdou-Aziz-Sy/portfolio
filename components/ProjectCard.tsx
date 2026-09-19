import Link from "next/link";
import { ViewTransition } from "react";
import type { Projet } from "@/lib/content";
import { MiniDiagram } from "@/components/diagrams/MiniDiagram";
import { MetaLine, StatusMeta } from "@/components/StatusMeta";
import { ProjectTags } from "@/components/Tags";

export function numeroDossier(n: number) {
  return `Dossier ${String(n).padStart(2, "0")}`;
}

export function ProjectCard({ projet }: { projet: Projet }) {
  return (
    <article
      className="pa-surface pa-card pa-card--lien"
      data-cats={projet.categories.join(" ")}
      data-testid="project-card"
    >
      <div className="pa-head">
        <span className="pa-meta">
          <MetaLine parties={[numeroDossier(projet.dossier), projet.annee]} />
        </span>
        <span className="pa-meta">
          <StatusMeta statut={projet.statut} />
        </span>
      </div>
      <div className="pa-card-fig">
        <MiniDiagram boites={projet.miniSchema} label={`Schéma de ${projet.titre}`} />
      </div>
      <div className="pa-card-body">
        {/* Animation 3 : le titre devient l'en-tête de l'étude au clic (tâche 5). Le `h3`, pas
            le lien : il vit hors du `<Link>` (la carte entière est cliquable via `::after` sur
            `.pa-card-cible`, styles/plan.css), donc l'envelopper dans <ViewTransition> ne peut
            ni casser cette zone cliquable ni introduire un second lien. `share`/`default="none"`
            (doc React, patron du morph personnalisé) : le nom `titre-${slug}` n'anime QUE
            l'appariement explicite avec le h1 de l'étude (composants/en-têtes ayant le même nom
            montés/démontés dans le même commit) ; une transition sans rapport ailleurs sur la
            page — ex. le remplacement du repli de ProjectGrid par la grille réelle à
            l'hydratation, qui pose le même nom dans les deux rendus puisqu'un seul est affiché à
            la fois — n'anime pas ce titre. */}
        <ViewTransition name={`titre-${projet.slug}`} share="titre" default="none">
          <h3 className="pa-h3">{projet.titre}</h3>
        </ViewTransition>
        <p className="pa-small">{projet.resume}</p>
        <ProjectTags projet={projet} />
      </div>
      <div className="pa-card-foot">
        <span className="pa-meta">{projet.cadre}</span>
        <Link className="pa-link pa-card-cible" href={`/projets/${projet.slug}`}>
          Ouvrir le dossier<span className="pa-sr"> {projet.titre}</span> →
        </Link>
      </div>
    </article>
  );
}
