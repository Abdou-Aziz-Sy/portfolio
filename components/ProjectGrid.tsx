"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ViewTransition, type ReactNode } from "react";
import { filtrerProjets, lireCategorie } from "@/lib/filters";
import { categories, categorieLabel, type Categorie } from "@/lib/schemas";

type Carte = { slug: string; categories: readonly string[]; carte: ReactNode };

function libelleCompte(n: number) {
  return `${n} dossier${n > 1 ? "s" : ""}`;
}

/* Tâche 6 : les filtres réorganisent la grille (cartes conservées qui glissent, retirées qui
   s'effacent, ajoutées qui apparaissent). `router.replace` est déjà une Transition React côté
   client (doc Next, view-transitions.md : « In Next.js, route navigations are transitions »),
   donc l'animation de réorganisation s'active seule dès qu'un `<ViewTransition name=…>` entoure
   chaque carte — vérifié : sans aucun objet `enter`/`exit`/`update` ni `default`, un changement de
   filtre anime déjà les cartes (constaté pendant l'implémentation). Le problème est inverse à
   celui du titre (tâche 5) : ici, il faut à la fois activer l'animation pendant UN filtre ET
   l'empêcher pendant une navigation carte → étude (le lien de la carte n'est pas un filtre), pour
   ne pas faire bouger toute la carte quand seul son titre doit devenir l'en-tête de l'étude.
   `default="none"` seul ne suffit pas ici : il désactive l'animation pour TOUTE transition sans
   rapport, y compris les changements de filtre eux-mêmes puisque rien ne les distingue d'une
   simple navigation. La doc (Step 3, « Add directional motion for navigation ») résout exactement
   ce problème avec des props `enter`/`exit` en OBJET, indexées par `transitionTypes` (posés via
   `router.push`/`replace`, doc use-router.md : « The optional transitionTypes are passed to
   React.addTransitionType… »), une clé `default` couvrant les navigations sans étiquette. On
   étiquette donc un changement de filtre `TYPE_FILTRE`, et seule cette étiquette anime la carte
   (`carte`, une classe pour les trois cas — `::view-transition-group` règle la position/taille,
   `::view-transition-old`/`-new` le fondu, styles/mouvement.css) ; `update` suit le même mécanisme
   que `enter`/`exit` (vérifié dans le React compilé avec Next, `getClassNameByType`, appelée de
   façon identique pour `props.update`, `props.enter`, `props.exit` et `props.default` —
   node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js). La navigation
   carte → étude (clic sur le lien de la carte) ne porte aucun `transitionTypes` : elle retombe sur
   la clé `default: "none"`, qui — comme pour le titre — retire la carte de cette transition (aucun
   `::view-transition-group` pour elle, vérifié : node_modules/…/react-dom-client.development.js,
   `"none" !== className` avant la pose du nom). Seul le titre imbriqué (`titre-${slug}`, déjà posé
   dans ProjectCard.tsx) anime alors, confirmant que l'imbrication de deux `<ViewTransition>` nommés
   ne pose pas de problème : chaque nom forme son propre groupe dans l'arbre de pseudo-éléments
   `::view-transition-group()`, sans lien de dépendance entre eux — celui de la carte peut rester
   inactif ("none") pendant que celui du titre, imbriqué, anime. */
const TYPE_FILTRE = "filtre-projets";

function proprietesTransitionCarte(slug: string) {
  return {
    name: `carte-${slug}`,
    enter: { [TYPE_FILTRE]: "carte", default: "none" },
    exit: { [TYPE_FILTRE]: "carte", default: "none" },
    update: { [TYPE_FILTRE]: "carte", default: "none" },
    default: "none",
  } as const;
}

/**
 * Grille filtrable. Les cartes sont rendues côté serveur et passées telles quelles ;
 * ce composant ne fait que choisir lesquelles afficher selon `?categorie=`.
 */
export function ProjectGrid({ cartes }: { cartes: Carte[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const chemin = usePathname();
  const active = lireCategorie(params.get("categorie"));
  const visibles = filtrerProjets(cartes, active);

  function choisir(cle: Categorie | null) {
    router.replace(cle ? `${chemin}?categorie=${cle}` : chemin, {
      scroll: false,
      transitionTypes: [TYPE_FILTRE],
    });
  }

  const onglets: { cle: Categorie | null; libelle: string }[] = [
    { cle: null, libelle: "Tous" },
    ...categories.map((cle) => ({ cle, libelle: categorieLabel[cle] })),
  ];

  return (
    <>
      <div className="pa-filterbar">
        <div className="pa-tabs" role="group" aria-label="Filtrer les projets">
          {onglets.map((o) => (
            <button key={o.libelle} type="button" aria-pressed={active === o.cle} onClick={() => choisir(o.cle)}>
              {o.libelle}
            </button>
          ))}
        </div>
        <span className="pa-meta" aria-live="polite" data-testid="compteur">
          {libelleCompte(visibles.length)}
        </span>
      </div>
      <div className="pa-grid pa-grid-projets">
        {visibles.map((c) => (
          // `key` ici, sur l'élément renvoyé par `.map()` (pas sur le `div` intérieur) : c'est cette
          // identité, comparée par React d'un rendu à l'autre, qui distingue une carte qui PERSISTE
          // (même clé, position différente → animation `update`) d'une carte qui sort ou entre
          // (clé absente avant ou après → `exit`/`enter`) ; la poser plus bas n'aurait aucun effet
          // sur cette identité de liste. `<ViewTransition>` ne pose aucun nœud DOM propre (voir
          // ProjectCard.tsx) : le nom s'applique donc bien au `div`, seul enfant réel de
          // `.pa-grid-projets` — vérifié par les tests de tests/e2e/mouvement.spec.ts, qui lisent
          // `viewTransitionName` sur `.pa-grid-projets > div`.
          <ViewTransition key={c.slug} {...proprietesTransitionCarte(c.slug)}>
            <div>{c.carte}</div>
          </ViewTransition>
        ))}
      </div>
    </>
  );
}

/** Version sans JavaScript et pendant le chargement : toutes les cartes.
 *  Mêmes noms `carte-${slug}` que ProjectGrid, `default="none"` seul (jamais de filtre à animer
 *  ici) : si ce repli venait à être affiché pendant une transition, la carte n'y participerait pas,
 *  par cohérence avec le comportement de ProjectGrid en dehors d'un changement de filtre. */
export function ProjectGridStatique({ cartes }: { cartes: Carte[] }) {
  return (
    <>
      <div className="pa-filterbar">
        <div className="pa-tabs" role="group" aria-label="Filtrer les projets">
          <button type="button" aria-pressed="true">
            Tous
          </button>
          {categories.map((cle) => (
            <button key={cle} type="button" aria-pressed="false" disabled>
              {categorieLabel[cle]}
            </button>
          ))}
        </div>
        <span className="pa-meta">{libelleCompte(cartes.length)}</span>
      </div>
      <div className="pa-grid pa-grid-projets">
        {cartes.map((c) => (
          <ViewTransition key={c.slug} name={`carte-${c.slug}`} default="none">
            <div>{c.carte}</div>
          </ViewTransition>
        ))}
      </div>
    </>
  );
}
