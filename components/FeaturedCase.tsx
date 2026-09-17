import type { Projet } from "@/lib/content";
import { Button } from "@/components/Button";
import { UgbLinkDiagram } from "@/components/diagrams/UgbLinkDiagram";
import { MiniDiagram } from "@/components/diagrams/MiniDiagram";
import { numeroDossier } from "@/components/ProjectCard";
import { MetaLine, StatusMeta } from "@/components/StatusMeta";
import { StatusLines } from "@/components/StatusLines";
import { ProjectTags } from "@/components/Tags";

export function FeaturedCase({ projet }: { projet: Projet }) {
  const avecSchemaComplet = projet.slug === "ugb-link";
  return (
    <article className="pa-surface">
      <div className="pa-head">
        <span className="pa-meta">
          <MetaLine
            parties={[numeroDossier(projet.dossier), projet.titre, projet.annee, <StatusMeta key="s" statut={projet.statut} />]}
          />
        </span>
        <span className="pa-meta">Étude de cas</span>
      </div>
      <div className="pa-feature">
        <div className="pa-feature-text">
          <h3 className="pa-h2">{projet.accroche}</h3>
          <p className="pa-lead pa-muted">{projet.resume}</p>
          {projet.lignesStatut ? <StatusLines lignes={projet.lignesStatut} /> : null}
          <ProjectTags projet={projet} />
          <div style={{ marginTop: "auto" }}>
            <Button href={`/projets/${projet.slug}`} arrow>
              Lire l&apos;étude de cas
            </Button>
          </div>
        </div>
        <figure className="pa-feature-fig pa-fig">
          {avecSchemaComplet ? (
            <div className="pa-diagram-scroll" tabIndex={0} role="region" aria-label="Schéma du système, défilable">
              <UgbLinkDiagram />
            </div>
          ) : (
            <MiniDiagram boites={projet.miniSchema} label={`Schéma de ${projet.titre}`} />
          )}
          <figcaption className="pa-meta">
            <MetaLine parties={["Fig. 01", "Système en production", "une VM, conteneurs Docker"]} />
          </figcaption>
        </figure>
      </div>
    </article>
  );
}
