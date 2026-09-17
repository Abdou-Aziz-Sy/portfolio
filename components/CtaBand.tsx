import { site } from "@/content/site";
import { Button, CvLabel } from "@/components/Button";
import { CopyEmail } from "@/components/CopyEmail";
import { TechIcon } from "@/components/TechIcon";

export function CtaBand() {
  return (
    <section id="contact" className="pa-cta" aria-labelledby="contact-titre">
      <div className="pa-wrap">
        <div>
          <span className="pa-meta">Contact</span>
          <h2 id="contact-titre" style={{ marginTop: 12 }}>
            Vous cherchez un ingénieur backend ou full stack ? <span className="pa-em">Parlons-en.</span>
          </h2>
          <p className="pa-cta-liens">
            <CopyEmail />
            {site.liens.github ? (
              <a className="pa-ilink" href={site.liens.github}>
                <TechIcon name="github" size={16} />
                GitHub
              </a>
            ) : null}
            {site.liens.linkedin ? (
              <a className="pa-ilink" href={site.liens.linkedin}>
                LinkedIn
              </a>
            ) : null}
          </p>
        </div>
        <div className="pa-cta-actions">
          <Button href={`mailto:${site.email}`} arrow className="pa-btn--center">
            Me contacter
          </Button>
          <Button href={site.cv.href} variant="secondary" download={site.cv.fichier} className="pa-btn--center">
            <CvLabel />
          </Button>
        </div>
      </div>
    </section>
  );
}
