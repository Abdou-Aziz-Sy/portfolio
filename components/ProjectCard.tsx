import Image from "next/image";
import Link from "next/link";
import { Commanditaire } from "@/components/Commanditaire";
import { ViewTransition } from "react";
import type { Projet } from "@/lib/content";
import { MiniDiagram } from "@/components/diagrams/MiniDiagram";
import { MetaLine, StatusMeta } from "@/components/StatusMeta";
import { ProjectTags } from "@/components/Tags";

export function numeroDossier(n: number) {
  return `Dossier ${String(n).padStart(2, "0")}`;
}

export function ProjectCard({ projet }: { projet: Projet }) {
  return (
    <article
      className="pa-surface pa-card pa-card--lien"
      data-cats={projet.categories.join(" ")}
      data-testid="project-card"
    >
      <div className="pa-head">
        <span className="pa-meta">
          <MetaLine parties={[numeroDossier(projet.dossier), projet.annee]} />
        </span>
        <span className="pa-meta">
          <StatusMeta statut={projet.statut} />
        </span>
      </div>
      <div className={projet.couverture ? "pa-card-fig pa-card-fig--image" : "pa-card-fig"}>
        {projet.couverture ? (
          <Image src={projet.couverture} alt="" width={1280} height={720} sizes="(max-width: 767px) 100vw, 400px" />
        ) : (
          <MiniDiagram boites={projet.miniSchema} label={`Schéma de ${projet.titre}`} />
        )}
      </div>
      <div className="pa-card-body">
        {/* Animation 3 : le titre devient l'en-tête de l'étude au clic (tâche 5). Le `h3`, pas
            le lien : il vit hors du `<Link>` (la carte entière est cliquable via `::after` sur
            `.pa-card-cible`, styles/plan.css), donc l'envelopper dans <ViewTransition> ne peut
            ni casser cette zone cliquable ni introduire un second lien — <ViewTransition> ne pose
            d'ailleurs aucun nœud DOM propre : c'est un type d'élément spécial reconnu par le
            réconciliateur (`ViewTransition = Symbol.for("react.view_transition")`, voir
            node_modules/next/dist/compiled/react/cjs/react.development.js — le `react` de la
            racine de node_modules n'exporte PAS `ViewTransition`, seul le React compilé livré
            avec Next, utilisé à la compilation, l'expose), au même titre que
            `REACT_FRAGMENT_TYPE` pour `<Fragment>` — pas un composant qui rendrait un `<div>`
            englobant. `share="titre"` + `default="none"` (doc React, patron du morph
            personnalisé) : le nom `titre-${slug}` anime l'appariement explicite avec le h1 de
            l'étude ; `default="none"` retire en plus ce titre de toute transition SANS RAPPORT
            avec cet appariement pendant laquelle il PERSISTE (ni monté ni démonté) — ex. un
            changement de filtre sur /projets, qui laisse la carte UGB Link affichée. Sans cette
            prop, un tel changement de filtre ferait quand même animer ce titre (vérifié : voir le
            test dédié dans tests/e2e/mouvement.spec.ts, qui compare les deux configurations).
            Ce n'est PAS ce qui protège le remplacement du repli de ProjectGrid par la grille
            réelle à l'hydratation : ce remplacement ne déclenche aucune transition de vue que
            `default="none"` soit posé ou non (vérifié également), vraisemblablement parce qu'il a
            lieu pendant l'hydratation initiale, hors de toute Transition React côté client — le
            test associé n'est donc qu'un garde-fou de non-régression, pas une preuve du rôle de
            cette prop. */}
        <ViewTransition name={`titre-${projet.slug}`} share="titre" default="none">
          <h3 className="pa-h3">{projet.titre}</h3>
        </ViewTransition>
        <p className="pa-small">{projet.resume}</p>
        <ProjectTags projet={projet} />
      </div>
      <div className="pa-card-foot">
        <span className="pa-card-cadre">
          {projet.commanditaire ? <Commanditaire commanditaire={projet.commanditaire} hauteur={18} /> : null}
          <span className="pa-meta">{projet.cadre}</span>
        </span>
        <Link className="pa-link pa-card-cible" href={`/projets/${projet.slug}`}>
          Ouvrir le dossier<span className="pa-sr"> {projet.titre}</span> →
        </Link>
      </div>
    </article>
  );
}
