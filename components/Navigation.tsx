import Link from "next/link";
import { site } from "@/content/site";
import { Button } from "@/components/Button";
import { MobileMenu } from "@/components/MobileMenu";
import { NavLinks, type LienNav } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navigation({ avecBlog }: { avecBlog: boolean }) {
  const liens: LienNav[] = [
    { href: "/projets", libelle: "Projets" },
    ...(avecBlog ? [{ href: "/blog", libelle: "Blog" }] : []),
    { href: "/a-propos", libelle: "À propos" },
  ];
  return (
    <header className="pa-nav">
      <div className="pa-wrap">
        <Link className="pa-mark" href="/" aria-label={`${site.nom} — accueil`}>
          {site.initiales}
          <i>.</i>
        </Link>
        <nav className="pa-navlinks pa-desktop-only" aria-label="Principale">
          <NavLinks liens={liens} />
        </nav>
        <div className="pa-nav-actions">
          <ThemeToggle />
          <Button href="#contact" size="sm" arrow className="pa-desktop-only">
            Me contacter
          </Button>
          <MobileMenu liens={liens} />
        </div>
      </div>
    </header>
  );
}
