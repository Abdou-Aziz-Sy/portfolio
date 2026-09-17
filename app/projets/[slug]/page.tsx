import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getProjet, getProjets } from "@/lib/content";
import { composantsMdx } from "@/components/mdx";
import { numeroDossier } from "@/components/ProjectCard";
import { MetaLine, StatusMeta } from "@/components/StatusMeta";
import { TableOfContents } from "@/components/TableOfContents";
import { statutLabel } from "@/lib/schemas";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjets().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const projet = getProjet(slug);
  if (!projet) return {};
  return {
    title: projet.titre,
    description: projet.resume,
    alternates: { canonical: `/projets/${slug}` },
    openGraph: { title: projet.titre, description: projet.resume, type: "article" },
  };
}

export default async function EtudeDeCas({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const projets = getProjets();
  const index = projets.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const projet = projets[index];
  const suivant = projets[(index + 1) % projets.length];
  const numero = String(projet.dossier).padStart(2, "0");

  const bandeau = [
    { terme: "Rôle", valeur: projet.role },
    { terme: "Période", valeur: projet.periode },
    { terme: "Statut", valeur: statutLabel[projet.statut], statut: true },
    { terme: "Stack", valeur: projet.stackDetail, mono: true },
  ].filter((ligne) => ligne.valeur);

  return (
    <>
      <header className="pa-wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <span className="pa-meta">
          <Link href="/projets" style={{ textDecoration: "none" }}>
            Projets
          </Link>{" "}
          / dossier-{numero}
        </span>
        <div style={{ marginTop: 20 }}>
          <span className="pa-meta">
            <MetaLine
              parties={[numeroDossier(projet.dossier), projet.titre, projet.annee, <StatusMeta key="s" statut={projet.statut} />]}
            />
          </span>
        </div>
        <h1 className="pa-hero" style={{ marginTop: 16, maxWidth: "22ch" }}>
          {projet.accroche}
        </h1>
        <p className="pa-lead pa-muted" style={{ marginTop: 20, maxWidth: "56ch" }}>
          {projet.resume}
        </p>
        <dl className="pa-surface pa-metaband" style={{ margin: "40px 0 0" }}>
          {bandeau.map((ligne) => (
            <div key={ligne.terme}>
              <dt>{ligne.terme}</dt>
              {ligne.statut ? (
                <dd
                  className={projet.statut === "termine" ? "pa-st-done" : undefined}
                  style={{
                    color:
                      projet.statut === "en-production"
                        ? "var(--ok)"
                        : projet.statut === "en-cours"
                          ? "var(--accent)"
                          : undefined,
                    fontWeight: 600,
                  }}
                >
                  <StatusMeta statut={projet.statut} />
                </dd>
              ) : (
                <dd className={ligne.mono ? "pa-mono" : undefined} style={ligne.mono ? { fontSize: 13 } : undefined}>
                  {ligne.valeur}
                </dd>
              )}
            </div>
          ))}
        </dl>
        {projet.depot || projet.demo ? (
          <div className="pa-actions" style={{ marginTop: 24 }}>
            {projet.depot ? (
              <a className="pa-link" href={projet.depot}>
                Voir le dépôt →
              </a>
            ) : null}
            {projet.demo ? (
              <a className="pa-link" href={projet.demo}>
                Voir la démo →
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="pa-wrap pa-casegrid">
        <div style={{ paddingTop: 72, height: "100%" }}>
          <TableOfContents sections={projet.sections} />
        </div>
        <article className="pa-casebody">
          <MDXRemote
            source={projet.corps}
            components={composantsMdx(projet.sections)}
            options={{ blockJS: false, blockDangerousJS: true }}
          />

          {projets.length > 1 ? (
            <nav className="pa-surface pa-next" aria-label="Dossiers" style={{ marginTop: 72 }}>
              <Link href="/projets">
                <span className="pa-meta">← Index</span>
                <p className="pa-h3" style={{ marginTop: 6 }}>
                  Tous les projets
                </p>
              </Link>
              <Link href={`/projets/${suivant.slug}`}>
                <span className="pa-meta">
                  {suivant.dossier > projet.dossier ? "Dossier suivant" : "Retour au premier dossier"} —{" "}
                  {String(suivant.dossier).padStart(2, "0")} →
                </span>
                <p className="pa-h3" style={{ marginTop: 6 }}>
                  {suivant.titre}
                </p>
              </Link>
            </nav>
          ) : null}
        </article>
      </div>
    </>
  );
}
