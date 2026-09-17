import { SPRITE } from "@/lib/icons";

function Logo({ nom, x, y, taille = 16 }: { nom: string; x: number; y: number; taille?: number }) {
  return <use className="d-logo" href={`${SPRITE}#si-${nom}`} x={x} y={y} width={taille} height={taille} />;
}

/**
 * Schéma du système UGB Link, repris de la maquette et corrigé :
 * Nginx est installé sur la machine virtuelle, hors de Docker Compose ;
 * le modèle de langage tourne dans le conteneur `ollama` ; l'OCR tourne dans l'API.
 */
export function UgbLinkDiagram() {
  return (
    <svg viewBox="0 0 980 482" role="img" aria-labelledby="ugb-schema-titre">
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

      <rect className="d-box" x="16" y="160" width="160" height="52" />
      <text className="d-t" x="28" y="184">
        Navigateur
      </text>
      <text className="d-s" x="28" y="199">
        utilisateurs
      </text>

      <rect className="d-box" x="16" y="340" width="160" height="52" />
      <text className="d-t" x="28" y="364">
        GitHub Actions
      </text>
      <text className="d-s" x="28" y="379">
        build · déploiement
      </text>
      <Logo nom="githubactions" x={152} y={348} />

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

      <rect className="d-box" x="416" y="64" width="160" height="52" />
      <circle className="d-ok" cx="430" cy="84" r="3" />
      <text className="d-t" x="440" y="88">
        Front React
      </text>
      <text className="d-s" x="428" y="103">
        build statique
      </text>
      <Logo nom="react" x={552} y={72} />

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

      <path className="d-db" d="M650 54 A73.0 6 0 0 1 796 54 V98 A73.0 6 0 0 1 650 98 Z" />
      <path className="d-line" d="M650 54 A73.0 6 0 0 0 796 54" />
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

      <rect className="d-box" x="650" y="360" width="146" height="48" />
      <text className="d-t" x="662" y="382">
        Sauvegarde
      </text>
      <text className="d-s" x="662" y="397">
        cron · nocturne
      </text>

      <rect className="d-box" x="226" y="360" width="130" height="48" />
      <text className="d-t" x="238" y="382">
        Déploiement
      </text>
      <text className="d-s" x="238" y="397">
        conteneurs
      </text>

      <rect className="d-box" x="838" y="360" width="126" height="48" />
      <text className="d-t" x="850" y="382">
        Stockage
      </text>
      <text className="d-s" x="850" y="397">
        distant
      </text>

      <path className="d-flow" d="M176 186 L226 186" />
      <path className="d-packet" pathLength={100} d="M176 186 L226 186" />
      <polygon className="d-head" points="226,186 219,182 219,190" />
      <text className="d-s" x="180" y="178">
        HTTPS
      </text>

      <path className="d-flow" d="M356 178 L386 178 L386 90 L416 90" />
      <path className="d-packet" pathLength={100} d="M356 178 L386 178 L386 90 L416 90" />
      <polygon className="d-head" points="416,90 409,86 409,94" />
      <path className="d-flow" d="M356 194 L386 194 L386 282 L416 282" />
      <path className="d-packet" pathLength={100} d="M356 194 L386 194 L386 282 L416 282" />
      <polygon className="d-head" points="416,282 409,278 409,286" />
      <text className="d-p" x="368" y="152">
        /
      </text>
      <text className="d-p" x="360" y="240">
        /api
      </text>

      <path className="d-line" d="M576 282 L616 282" />
      <path className="d-line" d="M616 76 L616 284" />
      {[76, 148, 216, 284].map((y) => (
        <g key={y}>
          <path className="d-line" d={`M616 ${y} L650 ${y}`} />
          <polygon className="d-head-m" points={`650,${y} 643,${y - 4} 643,${y + 4}`} />
        </g>
      ))}

      <path className="d-flow" d="M176 366 L226 366" />
      <path className="d-packet" pathLength={100} d="M176 366 L226 366" />
      <polygon className="d-head" points="226,366 219,362 219,370" />
      <text className="d-s" x="184" y="356">
        déploie
      </text>

      <path className="d-dash" d="M796 76 L812 76 L812 384 L796 384" />
      <path className="d-dash" d="M796 216 L812 216" />
      <path className="d-flow" d="M812 384 L838 384" />
      <path className="d-packet" pathLength={100} d="M812 384 L838 384" />
      <polygon className="d-head" points="838,384 831,380 831,388" />

      <path className="d-flow" d="M416 298 L398 298 L398 330 L86 330 L86 212" strokeDasharray="4 3" />
      <polygon className="d-head" points="86,212 82,219 90,219" />
      <text className="d-s" x="236" y="324">
        SSE · notifications
      </text>

      <path className="d-line" d="M196 472 L816 472" />
      <path className="d-line" d="M196 467 L196 477 M816 467 L816 477" />
      <text className="d-dim" x="506" y="468" textAnchor="middle">
        une machine virtuelle
      </text>
    </svg>
  );
}
