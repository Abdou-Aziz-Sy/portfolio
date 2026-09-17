import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  size?: "sm";
  arrow?: boolean;
  download?: boolean | string;
  className?: string;
  children: ReactNode;
};

export function Button({ href, variant = "primary", size, arrow, download, className, children }: Props) {
  const classes = ["pa-btn", `pa-btn--${variant}`, size ? `pa-btn--${size}` : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  const contenu = (
    <>
      {children}
      {arrow ? (
        <span className="pa-arr" aria-hidden="true">
          →
        </span>
      ) : null}
    </>
  );
  const horsRouteur = /^(mailto:|https?:|#)/.test(href) || (download !== undefined && download !== false);
  if (horsRouteur) {
    return (
      <a className={classes} href={href} download={typeof download === "string" ? download : download || undefined}>
        {contenu}
      </a>
    );
  }
  return (
    <Link className={classes} href={href}>
      {contenu}
    </Link>
  );
}

export function CvLabel() {
  return (
    <>
      Télécharger le CV{" "}
      <span className="pa-mono" style={{ fontSize: 12 }}>
        PDF
      </span>
    </>
  );
}
