import Image from "next/image";
import { Children, isValidElement, type ReactNode } from "react";
import type { Section } from "@/lib/content";
import { slugifier } from "@/lib/slug";
import { DecisionRecord } from "@/components/DecisionRecord";
import { DiagramScroller } from "@/components/DiagramScroller";
import { UgbLinkDiagram } from "@/components/diagrams/UgbLinkDiagram";
import { FluxAvant } from "@/components/StatusLines";

/** Met en gras les passages entre ** dans un texte court (listes du frontmatter MDX). */
function gras(texte: string): ReactNode {
  return texte.split(/(\*\*[^*]+\*\*)/g).map((morceau, i) =>
    morceau.startsWith("**") ? (
      <strong key={i} style={{ fontWeight: 600 }}>
        {morceau.slice(2, -2)}
      </strong>
    ) : (
      morceau
    ),
  );
}

function texteDe(noeud: ReactNode): string {
  return Children.toArray(noeud)
    .map((n) => {
      if (typeof n === "string" || typeof n === "number") return String(n);
      if (isValidElement<{ children?: ReactNode }>(n)) return texteDe(n.props.children);
      return "";
    })
    .join("");
}

function Liste({ prefixe, items }: { prefixe?: string; items: string[] }) {
  return (
    <ol className="pa-list">
      {items.map((item, i) => {
        const n = String(i + 1).padStart(2, "0");
        return (
          <li key={item}>
            <span>{prefixe ? `${prefixe}-${n}` : n}</span>
            <span>{gras(item)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Contexte({ flux, children }: { flux: [string, string][]; children: ReactNode }) {
  return (
    <div className="pa-context">
      <div>{children}</div>
      <FluxAvant flux={flux} />
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="pa-prose">{children}</div>;
}

function SchemaUgbLink({ numero }: { numero: string }) {
  return (
    <figure className="pa-surface pa-fig" style={{ padding: 24 }}>
      <DiagramScroller label="Schéma d'architecture, défilable">
        <UgbLinkDiagram />
      </DiagramScroller>
      <figcaption className="pa-small" style={{ marginTop: 16 }}>
        <span className="pa-meta">Fig. {numero}</span>&nbsp; Nginx, installé sur la machine virtuelle, sert le front
        React et relaie <code>/api</code> vers Express ; les services tournent en conteneurs Docker. GitHub Actions
        déploie ; une sauvegarde nocturne part hors site.
      </figcaption>
    </figure>
  );
}

function Exploitation({ items }: { items: { titre: string; texte: string }[] }) {
  return (
    <div className="pa-ops">
      {items.map((item, i) => (
        <div className="pa-surface" key={item.titre}>
          <span className="pa-meta">ops-{String(i + 1).padStart(2, "0")}</span>
          <h3 className="pa-h3" style={{ margin: "6px 0" }}>
            {item.titre}
          </h3>
          <p className="pa-small">{item.texte}</p>
        </div>
      ))}
    </div>
  );
}

function Galerie({ images }: { images: { src: string; legende: string; largeur: number; hauteur: number; large?: boolean }[] }) {
  return (
    <div className="pa-gallery">
      {images.map((img) => (
        <figure key={img.src} style={img.large ? { gridColumn: "1 / -1" } : undefined}>
          <Image src={img.src} alt={img.legende} width={img.largeur} height={img.hauteur} sizes="(max-width: 767px) 100vw, 640px" />
          <figcaption className="pa-small" style={{ marginTop: 8 }}>
            {img.legende}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Callout({ titre = "À retenir", children }: { titre?: string; children: ReactNode }) {
  return (
    <aside className="pa-callout">
      <span className="pa-callout-label">{titre}</span>
      {children}
    </aside>
  );
}

function Pre({ children, titre }: { children?: ReactNode; titre?: string }) {
  const code = Children.only(children);
  const langage =
    isValidElement<{ className?: string }>(code) && code.props.className
      ? code.props.className.replace("language-", "")
      : "";
  return (
    <figure className="pa-code">
      {titre || langage ? (
        <div className="pa-code-head">
          <span className="pa-meta">{titre ?? "extrait"}</span>
          <span className="pa-meta">{langage}</span>
        </div>
      ) : null}
      <pre>{isValidElement<{ children?: ReactNode }>(code) ? code.props.children : children}</pre>
    </figure>
  );
}

function Figure({ numero, legende, children }: { numero: string; legende: string; children: ReactNode }) {
  return (
    <figure className="pa-surface pa-fig" style={{ padding: 20 }}>
      {children}
      <figcaption className="pa-small" style={{ marginTop: 8 }}>
        <span className="pa-meta">Fig. {numero}</span>&nbsp; {legende}
      </figcaption>
    </figure>
  );
}

/** Composants MDX d'une page : les titres de niveau 2 reçoivent leur numéro de section. */
export function composantsMdx(sections: Section[]) {
  const numeros = new Map(sections.map((s) => [s.id, s.numero]));
  return {
    h2: ({ children }: { children?: ReactNode }) => {
      const titre = texteDe(children);
      const id = slugifier(titre);
      return (
        <>
          <span className="pa-meta pa-secmeta">
            {numeros.get(id) ?? "—"} / {titre}
          </span>
          <h2 className="pa-h2" id={id}>
            {children}
          </h2>
        </>
      );
    },
    h3: ({ children }: { children?: ReactNode }) => <h3 className="pa-h3">{children}</h3>,
    a: ({ href = "", children }: { href?: string; children?: ReactNode }) => (
      <a className="pa-link" href={href}>
        {children}
      </a>
    ),
    pre: Pre,
    Liste,
    Contexte,
    Prose,
    SchemaUgbLink,
    Exploitation,
    Galerie,
    Callout,
    Figure,
    DecisionRecord,
  };
}
