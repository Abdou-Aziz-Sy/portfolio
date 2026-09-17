import type { Metadata } from "next";
import { Button } from "@/components/Button";

export const metadata: Metadata = { title: "Page introuvable" };

export default function PageIntrouvable() {
  return (
    <section className="pa-wrap" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <span className="pa-meta">Erreur 404</span>
      <h1 className="pa-hero" style={{ marginTop: 12, maxWidth: "18ch" }}>
        Cette page n&apos;existe <span className="pa-em">pas</span>.
      </h1>
      <p className="pa-lead pa-muted" style={{ marginTop: 20, maxWidth: "48ch" }}>
        Le lien est peut-être ancien, ou le contenu n&apos;est pas encore publié.
      </p>
      <div className="pa-actions" style={{ marginTop: 32 }}>
        <Button href="/" arrow>
          Accueil
        </Button>
        <Button href="/projets" variant="secondary">
          Projets
        </Button>
      </div>
    </section>
  );
}
