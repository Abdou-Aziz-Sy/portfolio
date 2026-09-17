import { iconLabel } from "@/lib/icons";
import type { Projet } from "@/lib/content";
import { TechIcon } from "@/components/TechIcon";

export function ProjectTags({ projet }: { projet: Pick<Projet, "stack" | "stackLibelles" | "libelles"> }) {
  return (
    <ul className="pa-tags">
      {projet.stack.map((cle) => (
        <li className="pa-tag" key={cle}>
          <TechIcon name={cle} size={13} />
          {projet.libelles?.[cle] ?? iconLabel[cle]}
        </li>
      ))}
      {(projet.stackLibelles ?? []).map((libelle) => (
        <li className="pa-tag" key={libelle}>
          {libelle}
        </li>
      ))}
    </ul>
  );
}

export function TextTags({ items }: { items: string[] }) {
  return (
    <ul className="pa-tags">
      {items.map((item) => (
        <li className="pa-tag" key={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}
