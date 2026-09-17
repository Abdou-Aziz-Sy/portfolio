import Link from "next/link";
import type { Projet } from "@/lib/content";
import { MiniDiagram } from "@/components/diagrams/MiniDiagram";
import { MetaLine, StatusMeta } from "@/components/StatusMeta";
import { ProjectTags } from "@/components/Tags";

export function numeroDossier(n: number) {
  return `Dossier ${String(n).padStart(2, "0")}`;
}

export function ProjectCard({ projet }: { projet: Projet }) {
  return (
    <article className="pa-surface pa-card" data-cats={projet.categories.join(" ")} data-testid="project-card">
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
        <h3 className="pa-h3">{projet.titre}</h3>
        <p className="pa-small">{projet.resume}</p>
        <ProjectTags projet={projet} />
      </div>
      <div className="pa-card-foot">
        <span className="pa-meta">{projet.cadre}</span>
        <Link className="pa-link" href={`/projets/${projet.slug}`}>
          Ouvrir le dossier<span className="pa-sr"> {projet.titre}</span> →
        </Link>
      </div>
    </article>
  );
}
