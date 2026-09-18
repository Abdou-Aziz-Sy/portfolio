import Link from "next/link";
import type { Projet } from "@/lib/content";
import { Button } from "@/components/Button";
import { UgbLinkDiagramSimple } from "@/components/diagrams/UgbLinkDiagramSimple";
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
            parties={[
              numeroDossier(projet.dossier),
              <span key="titre" className="pa-meta-titre">
                {projet.titre}
              </span>,
              projet.annee,
              <StatusMeta key="s" statut={projet.statut} />,
            ]}
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
            <UgbLinkDiagramSimple />
          ) : (
            <MiniDiagram boites={projet.miniSchema} label={`Schéma de ${projet.titre}`} />
          )}
          <figcaption className="pa-meta">
            <MetaLine parties={["Fig. 01", "Système en production", "une VM, conteneurs Docker"]} />
            {avecSchemaComplet ? (
              <Link className="pa-link pa-fig-lien" href={`/projets/${projet.slug}#architecture`}>
                Voir le schéma complet →
              </Link>
            ) : null}
          </figcaption>
        </figure>
      </div>
    </article>
  );
}
