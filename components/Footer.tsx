import Link from "next/link";
import { site } from "@/content/site";
import { hoteAffiche } from "@/lib/site-url";
import { TechIcon } from "@/components/TechIcon";

export function Footer() {
  return (
    <footer className="pa-footer">
      <div className="pa-wrap">
        <div className="pa-footer-top">
          <Link className="pa-mark" href="/" style={{ margin: 0 }} aria-label={`${site.nom} — accueil`}>
            {site.initiales}
            <i>.</i>
          </Link>
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
          <span>
            <span className="pa-dot" />
            {hoteAffiche()} · tous les services opérationnels
          </span>
          <span>Dakar, SN · © 2026</span>
        </div>
      </div>
    </footer>
  );
}
