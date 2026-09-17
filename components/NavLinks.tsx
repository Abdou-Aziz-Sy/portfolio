"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LienNav = { href: string; libelle: string };

export function NavLinks({ liens, onNavigate }: { liens: LienNav[]; onNavigate?: () => void }) {
  const chemin = usePathname();
  return (
    <>
      {liens.map((lien) => {
        const actif = chemin === lien.href || chemin.startsWith(`${lien.href}/`);
        return (
          <Link key={lien.href} href={lien.href} aria-current={actif ? "page" : undefined} onClick={onNavigate}>
            {lien.libelle}
          </Link>
        );
      })}
    </>
  );
}
