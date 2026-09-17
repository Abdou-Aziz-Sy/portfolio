import Link from "next/link";
import { site } from "@/content/site";

/**
 * Logo du site. Le nom complet s'affiche à partir de 768 px, les initiales en dessous.
 * Le nom accessible reprend le texte visible le plus complet (WCAG 2.5.3).
 */
export function Wordmark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Link className={`pa-mark ${className ?? ""}`.trim()} href={`/`} style={style}>
      <span className="pa-mark-court">
        {site.initiales}
        <i>.</i>
      </span>
      <span className="pa-mark-long">{site.nom}</span>
    </Link>
  );
}
