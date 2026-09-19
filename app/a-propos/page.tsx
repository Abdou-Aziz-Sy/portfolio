import type { Metadata } from "next";
import { site } from "@/content/site";
import { Button, CvLabel } from "@/components/Button";
import { Disponibilite } from "@/components/Disponibilite";
import { DomainColumns } from "@/components/DomainColumn";
import { Frame } from "@/components/Frame";
import { numeroteur, SectionHead } from "@/components/SectionHead";
import { MetaLine } from "@/components/StatusMeta";
import { TechIcon } from "@/components/TechIcon";

export const metadata: Metadata = {
  title: "À propos",
  description: "Ingénieur logiciel diplômé de l'École Supérieure Polytechnique de Dakar, orienté backend.",
  alternates: { canonical: "/a-propos" },
};

export default function APropos() {
  const section = numeroteur();
  return (
    <section className="pa-wrap pa-aboutgrid">
      <div className="pa-aboutside">
        <Frame feuille="02" variante="apropos" />
        <span className="pa-meta">
          <MetaLine
            parties={[
              site.ville,
              <Disponibilite key="dispo" />,
            ]}
          />
        </span>
        <Button href={site.cv.href} download={site.cv.fichier} className="pa-btn--center">
          <CvLabel />
        </Button>
        <Button href="#contact" variant="secondary" className="pa-btn--center">
          Me contacter
        </Button>
      </div>

      <div>
        <span className="pa-meta">À propos</span>
        <h1 className="pa-hero" style={{ marginTop: 12 }}>
          Ingénieur logiciel, du côté <span className="pa-em">backend</span> de l&apos;écran.
        </h1>
        <p className="pa-lead pa-muted" style={{ marginTop: 20, maxWidth: "56ch" }}>
          Diplômé de l&apos;École Supérieure Polytechnique en 2026. Depuis février 2026, je conçois et exploite UGB Link
          en alternance à l&apos;Antenne de l&apos;Université Gaston Berger.
        </p>

        <div style={{ marginTop: 64 }}>
          <SectionHead meta={section("Parcours")} titre="Frise" />
          <ol className="pa-timeline">
            {site.parcours.map((etape) => (
              <li className={etape.actuel ? "is-now" : undefined} key={etape.titre}>
                <span className="pa-when">{etape.periode}</span>
                <span className="pa-rail" aria-hidden="true" />
                <div className="pa-what">
                  <b>{etape.titre}</b>
                  {etape.detail ? <p className="pa-small">{etape.detail}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div style={{ marginTop: 48 }}>
          <SectionHead meta={section("Domaines")} titre="En bref" />
          <DomainColumns domaines={site.domaines} variante="breve" />
        </div>

        <div style={{ marginTop: 64 }}>
          <SectionHead meta={section("Stack")} titre="Stack principale" />
          <ul className="pa-techs" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {site.stack.map((t) => (
              <li className="pa-tech" key={t.nom}>
                <TechIcon name={t.icone} size={28} />
                <div>
                  <b>{t.nom}</b>
                  <span>{t.role}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
