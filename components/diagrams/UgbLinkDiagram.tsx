import { SPRITE } from "@/lib/icons";

function Logo({ nom, x, y, taille = 16 }: { nom: string; x: number; y: number; taille?: number }) {
  return <use className="d-logo" href={`${SPRITE}#si-${nom}`} x={x} y={y} width={taille} height={taille} />;
}

/** Identifiants des blocs du schéma, dans l'ordre où ils apparaissent dans le SVG. */
export const NOEUDS_UGB = [
  "navigateur",
  "github",
  "nginx",
  "front",
  "api",
  "postgresql",
  "redis",
  "minio",
  "ollama",
  "sauvegarde",
  "deploiement",
  "stockage",
] as const;

export type NoeudUgb = (typeof NOEUDS_UGB)[number];

/** Un segment du schéma : un groupe `<g data-flux="…">` du rendu. */
export type SegmentUgb = { id: string; relie: readonly NoeudUgb[]; ordre: number };

/**
 * Tous les segments du schéma (tracé, paquet, pointe de flèche, libellé), troncs partagés
 * compris — un par groupe `<g data-flux="…">` du rendu, dans l'ordre du trajet d'une
 * requête (`ordre`). `id` reprend la valeur de `data-flux` ; `relie` reprend `data-relie`
 * (les blocs que ce segment relie visuellement, dont la tâche 4 se sert pour allumer tout
 * ce qui touche un bloc survolé).
 *
 * Remplace l'ancien `FLUX_UGB` (`{ de: string; vers: string }`) : un seul tableau, qui
 * couvre aussi les troncs partagés (`api-bus`) sans forcer une relation à deux extrémités
 * là où le tracé en a plus — et où `relie` est typé `NoeudUgb[]`, donc vérifié à la
 * compilation contre `NOEUDS_UGB`.
 */
export const SEGMENTS_UGB: readonly SegmentUgb[] = [
  { id: "navigateur-nginx", relie: ["navigateur", "nginx"], ordre: 1 },
  { id: "nginx-front", relie: ["nginx", "front"], ordre: 2 },
  { id: "nginx-api", relie: ["nginx", "api"], ordre: 2 },
  // Tronc partagé (canal vertical x=616) : relie l'API à ses quatre services d'un coup.
  { id: "api-bus", relie: ["api", "postgresql", "redis", "minio", "ollama"], ordre: 3 },
  { id: "api-postgresql", relie: ["api", "postgresql"], ordre: 3 },
  { id: "api-redis", relie: ["api", "redis"], ordre: 3 },
  { id: "api-minio", relie: ["api", "minio"], ordre: 3 },
  { id: "api-ollama", relie: ["api", "ollama"], ordre: 3 },
  { id: "api-navigateur", relie: ["api", "navigateur"], ordre: 4 },
  { id: "github-deploiement", relie: ["github", "deploiement"], ordre: 5 },
  { id: "postgresql-sauvegarde", relie: ["postgresql", "sauvegarde"], ordre: 6 },
  // Canal partagé (x=812) : ce segment ne touche pas le rectangle « sauvegarde » (il
  // rejoint le tracé postgresql-sauvegarde à y=216, voir plus bas) mais prolonge un canal
  // relié à ce bloc — la relation logique minio → sauvegarde reste donc dans `relie`.
  { id: "minio-sauvegarde", relie: ["minio", "sauvegarde"], ordre: 6 },
  { id: "sauvegarde-stockage", relie: ["sauvegarde", "stockage"], ordre: 6 },
];

/**
 * Attributs `data-flux`/`data-ordre`/`data-relie` d'un groupe de flux, lus depuis
 * `SEGMENTS_UGB` : garantit que le rendu et l'export ne peuvent pas diverger.
 */
function flux(id: string) {
  const segment = SEGMENTS_UGB.find((s) => s.id === id);
  if (!segment) throw new Error(`segment UGB inconnu : ${id}`);
  return { "data-flux": segment.id, "data-ordre": segment.ordre, "data-relie": segment.relie.join(" ") };
}

/**
 * Textes d'explication du schéma (tâche 4), un par bloc, dans l'ordre de `NOEUDS_UGB`.
 * Repris tels quels du tableau de spécification : vérifiés contre le schéma complet et
 * l'étude de cas (`content/projets/ugb-link.mdx`). `titre` sert aussi de nom accessible
 * (`aria-label`) au bloc correspondant en mode explorable.
 */
export const EXPLICATIONS_UGB: Record<NoeudUgb, { titre: string; texte: string }> = {
  navigateur: {
    titre: "Navigateur",
    texte:
      "Les agents utilisent l'application dans leur navigateur ; les changements leur arrivent en direct, sans recharger la page.",
  },
  github: {
    titre: "GitHub Actions",
    texte: "Construit l'application, la déploie par SSH, puis vérifie que le site public répond.",
  },
  nginx: {
    titre: "Nginx",
    texte:
      "Installé sur la machine virtuelle, hors de Docker : il sert le front et relaie /api vers Express. La mise en mémoire tampon est désactivée pour les flux en direct.",
  },
  front: {
    titre: "Front React",
    texte: "L'interface, compilée en fichiers statiques et servie par Nginx.",
  },
  api: {
    titre: "API Express",
    texte:
      "Les routes, les rôles et l'OCR des documents scannés. Un bus d'événements en mémoire pousse chaque message aux seuls utilisateurs concernés.",
  },
  postgresql: {
    titre: "PostgreSQL",
    texte: "Les données des huit processus.",
  },
  redis: {
    titre: "Redis",
    texte: "Le cache et les files d'attente.",
  },
  minio: {
    titre: "MinIO",
    texte: "Le stockage des documents.",
  },
  ollama: {
    titre: "Ollama",
    texte:
      "Un petit modèle de langage dans son propre conteneur : il lit le document d'un appel à candidature et répond en JSON pour pré-remplir le formulaire.",
  },
  sauvegarde: {
    titre: "Sauvegarde",
    texte: "Une sauvegarde nocturne de la base et des documents.",
  },
  deploiement: {
    titre: "Déploiement",
    texte: "La mise à jour des conteneurs sur la machine virtuelle.",
  },
  stockage: {
    titre: "Stockage distant",
    texte:
      "Les sauvegardes partent hors site ; un exercice de restauration automatisé les restaure dans un environnement isolé et en contrôle le contenu.",
  },
};

/** Identifiant stable de l'entrée `<dd>` de la liste d'explications correspondant à un bloc. */
export function idExplicationUgb(id: NoeudUgb) {
  return `ugb-explication-${id}`;
}

/**
 * Attributs d'accessibilité posés sur un `g[data-noeud]` en mode explorable : bascule de
 * bouton (état initial non pressé, la sélection réelle est appliquée après montage par
 * `SchemaExplorable`, ce qui garde un rendu serveur identique au premier rendu client) et
 * lien vers son explication dans la liste `<dl>`.
 */
function proprietesNoeud(id: NoeudUgb) {
  return {
    tabIndex: 0,
    role: "button" as const,
    "aria-pressed": false,
    "aria-label": EXPLICATIONS_UGB[id].titre,
    "aria-describedby": idExplicationUgb(id),
  };
}

/** Branches du tronc `api-bus`, listées dans l'ordre vertical (y croissant) du tracé. */
const BRANCHES_API = [
  { y: 76, vers: "postgresql" },
  { y: 148, vers: "redis" },
  { y: 216, vers: "minio" },
  { y: 284, vers: "ollama" },
] as const;

/**
 * Schéma du système UGB Link, repris de la maquette et corrigé :
 * Nginx est installé sur la machine virtuelle, hors de Docker Compose ;
 * le modèle de langage tourne dans le conteneur `ollama` ; l'OCR tourne dans l'API.
 *
 * `explorable` (tâche 4) : pose la charpente d'accessibilité du mode explorable (rôle de
 * groupe plutôt que d'image, blocs focalisables et nommés) sans porter lui-même l'état
 * d'interaction — `SchemaExplorable` l'applique après montage, pour garder un rendu serveur
 * complet et identique au premier rendu client (aucune hydratation divergente).
 */
export function UgbLinkDiagram({ explorable = false }: { explorable?: boolean } = {}) {
  return (
    <svg viewBox="0 0 980 482" role={explorable ? "group" : "img"} aria-labelledby="ugb-schema-titre">
      <title id="ugb-schema-titre">
        Schéma du système UGB Link : le navigateur passe par Nginx, installé sur la machine virtuelle, qui sert le
        front React et relaie l&apos;API Express. Dans Docker Compose, l&apos;API s&apos;appuie sur PostgreSQL, Redis,
        MinIO et Ollama ; l&apos;OCR tourne dans l&apos;API. GitHub Actions déploie sur le serveur ; une sauvegarde
        nocturne part vers un stockage distant.
      </title>

      <rect className="d-zone" x="196" y="20" width="620" height="432" />
      <text className="d-z" x="208" y="40">
        VM — HÔTE
      </text>
      <rect className="d-zone" x="396" y="36" width="408" height="288" />
      <text className="d-z" x="428" y="54">
        DOCKER COMPOSE
      </text>
      <Logo nom="docker" x={404} y={40} taille={18} />
      <text className="d-z" x="16" y="40">
        CLIENT
      </text>
      <text className="d-z" x="16" y="322">
        CI/CD
      </text>
      <text className="d-z" x="838" y="322">
        HORS SITE
      </text>

      <g data-noeud="navigateur" {...(explorable ? proprietesNoeud("navigateur") : {})}>
        <rect className="d-box" x="16" y="160" width="160" height="52" />
        <text className="d-t" x="28" y="184">
          Navigateur
        </text>
        <text className="d-s" x="28" y="199">
          utilisateurs
        </text>
      </g>

      <g data-noeud="github" {...(explorable ? proprietesNoeud("github") : {})}>
        <rect className="d-box" x="16" y="340" width="160" height="52" />
        <text className="d-t" x="28" y="364">
          GitHub Actions
        </text>
        <text className="d-s" x="28" y="379">
          build · déploiement
        </text>
        <Logo nom="githubactions" x={152} y={348} />
      </g>

      <g data-noeud="nginx" {...(explorable ? proprietesNoeud("nginx") : {})}>
        <rect className="d-box" x="226" y="160" width="130" height="52" />
        <circle className="d-ok" cx="240" cy="180" r="3" />
        <text className="d-t" x="250" y="184">
          Nginx
        </text>
        <text className="d-s" x="238" y="199">
          proxy inverse
        </text>
        <text className="d-p" x="348" y="204" textAnchor="end">
          :443
        </text>
        <Logo nom="nginx" x={332} y={168} />
      </g>

      <g data-noeud="front" {...(explorable ? proprietesNoeud("front") : {})}>
        <rect className="d-box" x="416" y="64" width="160" height="52" />
        <circle className="d-ok" cx="430" cy="84" r="3" />
        <text className="d-t" x="440" y="88">
          Front React
        </text>
        <text className="d-s" x="428" y="103">
          build statique
        </text>
        <Logo nom="react" x={552} y={72} />
      </g>

      <g data-noeud="api" {...(explorable ? proprietesNoeud("api") : {})}>
        <rect className="d-box-acc" x="416" y="256" width="160" height="52" />
        <circle className="d-ok" cx="430" cy="276" r="3" />
        <text className="d-t" x="440" y="280">
          API Express
        </text>
        <text className="d-s" x="428" y="295">
          Node.js · OCR
        </text>
        <text className="d-p" x="568" y="300" textAnchor="end">
          :3000
        </text>
        <Logo nom="nodedotjs" x={552} y={264} />
      </g>

      <g data-noeud="postgresql" {...(explorable ? proprietesNoeud("postgresql") : {})}>
        <path className="d-db" d="M650 54 A73.0 6 0 0 1 796 54 V98 A73.0 6 0 0 1 650 98 Z" />
        <path className="d-line" pathLength={1} d="M650 54 A73.0 6 0 0 0 796 54" />
        <text className="d-t" x="662" y="78">
          PostgreSQL
        </text>
        <text className="d-s" x="662" y="92">
          données
        </text>
        <text className="d-p" x="788" y="98" textAnchor="end">
          :5432
        </text>
        <Logo nom="postgresql" x={772} y={62} />
      </g>

      <g data-noeud="redis" {...(explorable ? proprietesNoeud("redis") : {})}>
        <rect className="d-box" x="650" y="124" width="146" height="48" />
        <circle className="d-ok" cx="664" cy="142" r="3" />
        <text className="d-t" x="674" y="146">
          Redis
        </text>
        <text className="d-s" x="662" y="161">
          cache · files
        </text>
        <text className="d-p" x="788" y="164" textAnchor="end">
          :6379
        </text>
        <Logo nom="redis" x={772} y={132} />
      </g>

      <g data-noeud="minio" {...(explorable ? proprietesNoeud("minio") : {})}>
        <rect className="d-box" x="650" y="192" width="146" height="48" />
        <circle className="d-ok" cx="664" cy="210" r="3" />
        <text className="d-t" x="674" y="214">
          MinIO
        </text>
        <text className="d-s" x="662" y="229">
          documents
        </text>
        <text className="d-p" x="788" y="232" textAnchor="end">
          :9000
        </text>
        <Logo nom="minio" x={772} y={200} />
      </g>

      <g data-noeud="ollama" {...(explorable ? proprietesNoeud("ollama") : {})}>
        <rect className="d-box" x="650" y="260" width="146" height="48" />
        <circle className="d-ok" cx="664" cy="278" r="3" />
        <text className="d-t" x="674" y="282">
          Ollama
        </text>
        <text className="d-s" x="662" y="297">
          LLM
        </text>
        <text className="d-p" x="788" y="300" textAnchor="end">
          :11434
        </text>
        <Logo nom="ollama" x={772} y={268} />
      </g>

      <g data-noeud="sauvegarde" {...(explorable ? proprietesNoeud("sauvegarde") : {})}>
        <rect className="d-box" x="650" y="360" width="146" height="48" />
        <text className="d-t" x="662" y="382">
          Sauvegarde
        </text>
        <text className="d-s" x="662" y="397">
          cron · nocturne
        </text>
      </g>

      <g data-noeud="deploiement" {...(explorable ? proprietesNoeud("deploiement") : {})}>
        <rect className="d-box" x="226" y="360" width="130" height="48" />
        <text className="d-t" x="238" y="382">
          Déploiement
        </text>
        <text className="d-s" x="238" y="397">
          conteneurs
        </text>
      </g>

      <g data-noeud="stockage" {...(explorable ? proprietesNoeud("stockage") : {})}>
        <rect className="d-box" x="838" y="360" width="126" height="48" />
        <text className="d-t" x="850" y="382">
          Stockage
        </text>
        <text className="d-s" x="850" y="397">
          distant
        </text>
      </g>

      <g data-de="navigateur" data-vers="nginx" {...flux("navigateur-nginx")}>
        <path className="d-flow" pathLength={1} d="M176 186 L226 186" />
        <path className="d-packet" pathLength={100} d="M176 186 L226 186" />
        <polygon className="d-head" points="226,186 219,182 219,190" />
        <text className="d-s" x="180" y="178">
          HTTPS
        </text>
      </g>

      <g data-de="nginx" data-vers="front" {...flux("nginx-front")}>
        <path className="d-flow" pathLength={1} d="M356 178 L386 178 L386 90 L416 90" />
        <path className="d-packet" pathLength={100} d="M356 178 L386 178 L386 90 L416 90" />
        <polygon className="d-head" points="416,90 409,86 409,94" />
        <text className="d-p" x="368" y="152">
          /
        </text>
      </g>

      <g data-de="nginx" data-vers="api" {...flux("nginx-api")}>
        <path className="d-flow" pathLength={1} d="M356 194 L386 194 L386 282 L416 282" />
        <path className="d-packet" pathLength={100} d="M356 194 L386 194 L386 282 L416 282" />
        <polygon className="d-head" points="416,282 409,278 409,286" />
        <text className="d-p" x="360" y="240">
          /api
        </text>
      </g>

      {/*
        Tronc commun aux quatre branches API → PostgreSQL/Redis/MinIO/Ollama : inclure ce
        tracé dans chacun des quatre groupes de flux dupliquerait le trait. Il vit donc dans
        son propre groupe, référencé par les quatre identifiants de destination. C'est un
        canal partagé (vertical, x=616) : il ne touche à l'aplomb d'aucun bloc autre que
        l'API, mais `relie` liste tout de même les quatre services, puisque chaque branche
        qui en part (ci-dessous) le prolonge jusqu'à eux.
      */}
      <g data-de="api" data-vers="postgresql redis minio ollama" {...flux("api-bus")}>
        <path className="d-line" pathLength={1} d="M576 282 L616 282" />
        <path className="d-line" pathLength={1} d="M616 76 L616 284" />
      </g>
      {BRANCHES_API.map(({ y, vers }) => (
        <g key={vers} data-de="api" data-vers={vers} {...flux(`api-${vers}`)}>
          <path className="d-line" pathLength={1} d={`M616 ${y} L650 ${y}`} />
          <polygon className="d-head-m" points={`650,${y} 643,${y - 4} 643,${y + 4}`} />
        </g>
      ))}

      <g data-de="api" data-vers="navigateur" {...flux("api-navigateur")}>
        <path className="d-flow" d="M416 298 L398 298 L398 330 L86 330 L86 212" strokeDasharray="4 3" />
        <polygon className="d-head" points="86,212 82,219 90,219" />
        <text className="d-s" x="236" y="324">
          SSE · notifications
        </text>
      </g>

      <g data-de="github" data-vers="deploiement" {...flux("github-deploiement")}>
        <path className="d-flow" pathLength={1} d="M176 366 L226 366" />
        <path className="d-packet" pathLength={100} d="M176 366 L226 366" />
        <polygon className="d-head" points="226,366 219,362 219,370" />
        <text className="d-s" x="184" y="356">
          déploie
        </text>
      </g>

      {/*
        Ce tracé en tirets mêle deux relations : le trait descend de PostgreSQL (796,76)
        jusqu'à la ligne de Sauvegarde (812,384), et sert aussi de tronc vertical (canal
        partagé, x=812) que rejoint le tracé MinIO → Sauvegarde à y=216 (groupe suivant).
        Faute de pouvoir le scinder sans dupliquer le tracé, il est rattaché à
        `postgresql-sauvegarde`.
      */}
      <g data-de="postgresql" data-vers="sauvegarde" {...flux("postgresql-sauvegarde")}>
        <path className="d-dash" d="M796 76 L812 76 L812 384 L796 384" />
      </g>

      {/*
        Ce segment part du bloc MinIO mais rejoint le canal partagé x=812 (ci-dessus) sans
        toucher directement le rectangle « sauvegarde » : il prolonge un canal relié à ce
        bloc, donc `relie` porte quand même la relation logique minio → sauvegarde.
      */}
      <g data-de="minio" data-vers="sauvegarde" {...flux("minio-sauvegarde")}>
        <path className="d-dash" d="M796 216 L812 216" />
      </g>

      {/*
        Ce segment part lui aussi du canal partagé x=812 (pas du rectangle « sauvegarde »
        lui-même, atteint via les deux tracés en tirets ci-dessus) pour rejoindre
        « stockage » : même logique que minio-sauvegarde, `relie` porte la relation
        logique sauvegarde → stockage.
      */}
      <g data-de="sauvegarde" data-vers="stockage" {...flux("sauvegarde-stockage")}>
        <path className="d-flow" pathLength={1} d="M812 384 L838 384" />
        <path className="d-packet" pathLength={100} d="M812 384 L838 384" />
        <polygon className="d-head" points="838,384 831,380 831,388" />
      </g>

      <path className="d-line" pathLength={1} d="M196 472 L816 472" />
      <path className="d-line" pathLength={1} d="M196 467 L196 477 M816 467 L816 477" />
      <text className="d-dim" x="506" y="468" textAnchor="middle">
        une machine virtuelle
      </text>
    </svg>
  );
}
