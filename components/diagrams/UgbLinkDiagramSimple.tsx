/**
 * Version simplifiée du schéma d'UGB Link, pour la carte vedette de l'accueil :
 * quatre blocs lisibles à toute largeur. Le schéma complet vit dans l'étude de cas.
 *
 * Fidèle au schéma complet (UgbLinkDiagram) : Nginx est installé sur la machine
 * virtuelle, hors de Docker Compose, et relaie l'API Express ; l'OCR tourne dans
 * l'API ; le modèle de langage est servi par le conteneur `ollama` ; PostgreSQL,
 * Redis et MinIO sont des conteneurs. Dans le schéma complet, c'est l'API Express
 * qui appelle PostgreSQL/Redis/MinIO et Ollama (il n'y a pas de lien direct entre
 * Ollama et PostgreSQL) : les flux ci-dessous relient donc l'API aux deux blocs du
 * bas, pas les deux blocs du bas entre eux.
 */
// Correction ronde 1 : un sous-titre lit comme « ce qui compose ce bloc ». « Nginx · OCR »
// laissait croire que Nginx fait partie de l'API Express (faux : Nginx tourne sur la VM,
// hors Docker Compose) ; « Redis · MinIO » laissait croire que ces conteneurs font partie
// de PostgreSQL (faux : ce sont trois conteneurs distincts). « via Nginx » signale une
// relation (l'API est placée derrière Nginx, pas composée de Nginx) ; le « · OCR » qui
// suit reste un point médian car l'OCR est bien un fait propre à l'API elle-même, pas une
// entité tierce. « + Redis + MinIO » signale une addition de conteneurs pairs, pas une
// inclusion dans PostgreSQL.
const BLOCS = [
  { x: 8, y: 8, titre: "Navigateur", sous: "React" },
  { x: 184, y: 8, titre: "API Express", sous: "via Nginx · OCR" },
  { x: 8, y: 112, titre: "PostgreSQL", sous: "+ Redis + MinIO" },
  { x: 184, y: 112, titre: "Ollama", sous: "modèle de langage" },
];

export function UgbLinkDiagramSimple() {
  return (
    <svg viewBox="0 0 360 200" role="img" aria-labelledby="ugb-simple-titre" className="pa-schema-simple">
      <title id="ugb-simple-titre">
        Vue simplifiée d&apos;UGB Link : le navigateur appelle l&apos;API Express, placée derrière Nginx. L&apos;API
        s&apos;appuie sur PostgreSQL, Redis et MinIO, et sur un modèle de langage servi par Ollama.
      </title>
      {BLOCS.map((b, i) => (
        <g key={b.titre}>
          <rect className={i === 1 ? "d-box-acc" : "d-box"} x={b.x} y={b.y} width="168" height="80" />
          <text className="d-t" x={b.x + 14} y={b.y + 34} style={{ fontSize: 17 }}>
            {b.titre}
          </text>
          {/* fontSize: 14 remplace volontairement les 10,5 px par défaut de .d-s (styles/plan.css) :
              trop petit une fois mis à l'échelle sur la figure réduite de la carte vedette. */}
          <text className="d-s" x={b.x + 14} y={b.y + 58} style={{ fontSize: 14 }}>
            {b.sous}
          </text>
        </g>
      ))}
      <path className="d-flow" d="M176 48 L184 48" />
      <path className="d-flow" d="M268 88 L268 112" />
      <path className="d-flow" d="M220 88 L220 100 L100 100 L100 112" />
    </svg>
  );
}
