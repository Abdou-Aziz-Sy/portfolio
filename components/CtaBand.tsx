import { site } from "@/content/site";
import { Button, CvLabel } from "@/components/Button";

export function CtaBand() {
  return (
    <section id="contact" className="pa-cta" aria-labelledby="contact-titre">
      <div className="pa-wrap">
        <div>
          <span className="pa-meta">Contact</span>
          <h2 id="contact-titre" style={{ marginTop: 12 }}>
            Vous cherchez un ingénieur backend ou full stack ? <span className="pa-em">Parlons-en.</span>
          </h2>
        </div>
        <div className="pa-cta-actions">
          <Button href={`mailto:${site.email}`} arrow className="pa-btn--center">
            Me contacter
          </Button>
          <Button href="/cv.pdf" variant="secondary" download className="pa-btn--center">
            <CvLabel />
          </Button>
        </div>
      </div>
    </section>
  );
}
