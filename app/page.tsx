import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { getArticles, getProjets } from "@/lib/content";
import { ArticleList } from "@/components/ArticleList";
import { Button } from "@/components/Button";
import { Disponibilite } from "@/components/Disponibilite";
import { DomainColumns } from "@/components/DomainColumn";
import { FactStrip } from "@/components/FactStrip";
import { FeaturedCase } from "@/components/FeaturedCase";
import { Frame } from "@/components/Frame";
import { ProjectCard } from "@/components/ProjectCard";
import { numeroteur, SectionHead } from "@/components/SectionHead";
import { MetaLine } from "@/components/StatusMeta";
import { Testimonial } from "@/components/Testimonial";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Accueil() {
  const projets = getProjets();
  const vedette = projets.find((p) => p.misEnAvant);
  const autres = projets.filter((p) => p !== vedette);
  const articles = getArticles();
  const section = numeroteur();

  return (
    <>
      <section className="pa-wrap" style={{ paddingTop: 88, paddingBottom: 96 }}>
        <div className="pa-herogrid">
          <div className="pa-rise">
            <span className="pa-meta" data-testid="surtitre-identite">
              {site.nom} <span className="pa-sep">·</span> {site.metier}
            </span>
            <h1 className="pa-hero">
              Ingénieur logiciel à Dakar. Je construis des{" "}
              <Link className="pa-inlink" href="/projets?categorie=backend">
                backends
              </Link>{" "}
              qui tiennent <span className="pa-em">en production</span>, je dessine des{" "}
              <Link className="pa-inlink" href="/projets/ugb-link#architecture">
                systèmes
              </Link>{" "}
              <span className="pa-em">avant</span> de les coder
              {articles.length > 0 ? (
                <>
                  , et j&apos;écris sur{" "}
                  <Link className="pa-inlink" href="/blog">
                    ce que j&apos;apprends
                  </Link>{" "}
                  en chemin
                </>
              ) : null}
              .
            </h1>
          </div>
          <div className="pa-rise d2 pa-herofig">
            <Frame feuille="01" variante="accueil" />
          </div>
        </div>
        <div className="pa-rise d3 pa-herometa">
          <span className="pa-meta">
            <MetaLine
              parties={[
                site.ville,
                site.diplome,
                <Disponibilite key="dispo" />,
              ]}
            />
          </span>
          <div className="pa-actions">
            {vedette ? (
              <Button href={`/projets/${vedette.slug}`} arrow>
                Voir l&apos;étude de cas {vedette.titre}
              </Button>
            ) : null}
            <Button href="#contact" variant="secondary">
              Me contacter
            </Button>
          </div>
        </div>
      </section>

      <section className="pa-intro" aria-label="Présentation">
        <span className="pa-meta" style={{ paddingTop: 6 }}>
          Présentation
        </span>
        <p className="pa-lead" style={{ maxWidth: "62ch" }}>
          J&apos;ai conçu et mis en production une application de gestion interne pour l&apos;Antenne de
          l&apos;Université Gaston Berger. Ce qui me passionne, c&apos;est tout ce que l&apos;utilisateur ne voit pas :{" "}
          <span style={{ color: "var(--accent)" }}>les services, les données, le déploiement</span> et ce qui se passe
          quand ça casse.
        </p>
      </section>

      <div className="pa-wrap pa-main">
        <section aria-labelledby="titre-domaines">
          <SectionHead id="titre-domaines" meta={section("Domaines")} titre="Ce que je fais derrière l’écran" />
          <DomainColumns domaines={site.domaines} variante="complete" />
          <p className="pa-small" style={{ marginTop: 16 }}>
            <span className="pa-mono">Côté interface :</span> {site.interface}
          </p>
        </section>

        <section aria-label="Faits">
          <FactStrip faits={site.faits} />
        </section>

        {vedette ? (
          <section aria-labelledby="titre-vedette">
            <SectionHead id="titre-vedette" meta={section("Étude de cas")} titre="Travail mis en avant" />
            <FeaturedCase projet={vedette} />
          </section>
        ) : null}

        {autres.length > 0 ? (
          <section aria-labelledby="titre-projets">
            <SectionHead
              id="titre-projets"
              meta={section("Autres dossiers")}
              titre="Projets"
              lien={{ href: "/projets", libelle: "Tous les projets" }}
            />
            <div className="pa-grid">
              {autres.map((p) => (
                <ProjectCard key={p.slug} projet={p} />
              ))}
            </div>
          </section>
        ) : null}

        {site.recommandations.length > 0 ? (
          <section aria-labelledby="titre-recommandations">
            <SectionHead
              id="titre-recommandations"
              meta={section("Recommandations")}
              titre="Ils ont travaillé avec moi"
            />
            <div className="pa-grid pa-grid--2">
              {site.recommandations.map((r) => (
                <Testimonial key={r.nom} recommandation={r} />
              ))}
            </div>
          </section>
        ) : null}

        {articles.length > 0 ? (
          <section aria-labelledby="titre-blog">
            <SectionHead
              id="titre-blog"
              meta={section("Blog")}
              titre="Derniers articles"
              lien={{ href: "/blog", libelle: "Tous les articles" }}
            />
            <ArticleList articles={articles.slice(0, 3)} />
          </section>
        ) : null}
      </div>
    </>
  );
}
