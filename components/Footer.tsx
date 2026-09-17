import { site } from "@/content/site";
import { TechIcon } from "@/components/TechIcon";
import { Wordmark } from "@/components/Wordmark";

export function Footer() {
  return (
    <footer className="pa-footer">
      <div className="pa-wrap">
        <div className="pa-footer-top">
          <Wordmark style={{ margin: 0 }} />
          <ul>
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            {site.liens.linkedin ? (
              <li>
                <a href={site.liens.linkedin}>LinkedIn</a>
              </li>
            ) : null}
            {site.liens.github ? (
              <li>
                <a href={site.liens.github} className="pa-ilink">
                  <TechIcon name="github" size={16} />
                  GitHub
                </a>
              </li>
            ) : null}
            <li>
              <a href="/cv.pdf" download>
                Télécharger le CV
              </a>
            </li>
          </ul>
        </div>
        <div className="pa-footer-bar">
          <span className="is-dispo">
            <span className="pa-dot is-dispo" />
            {site.disponibiliteDetail}
          </span>
          <span>Dakar, SN · © 2026</span>
        </div>
      </div>
    </footer>
  );
}
