import Image from "next/image";
import type { ProjetMeta } from "@/lib/schemas";

type Props = { commanditaire: NonNullable<ProjetMeta["commanditaire"]>; hauteur: number; avecNom?: boolean };

/** Logo de l'établissement commanditaire, avec son nom en toutes lettres si la place le permet. */
export function Commanditaire({ commanditaire, hauteur, avecNom = false }: Props) {
  const { nom, detail, logo, largeur, hauteur: hauteurLogo } = commanditaire;
  return (
    <span className="pa-commanditaire" data-testid="commanditaire">
      <Image
        src={logo}
        alt={`Logo : ${nom}`}
        width={Math.round((hauteur * largeur) / hauteurLogo)}
        height={hauteur}
        style={{ height: hauteur + 6 }}
      />
      {avecNom ? (
        <span className="pa-meta">
          {nom}
          {detail ? <span className="pa-muted"> · {detail}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
