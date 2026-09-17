import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { getArticles } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { CtaBand } from "@/components/CtaBand";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { ThemeScript } from "@/components/ThemeScript";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});
const accent = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-accent",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${site.nom} — ${site.metier}`, template: `%s — ${site.nom}` },
  description: site.description,
  authors: [{ name: site.nom }],
  openGraph: { type: "website", locale: "fr_SN", siteName: site.nom },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020a13" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5f7" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const avecBlog = getArticles().length > 0;
  return (
    <html
      lang="fr"
      data-theme="dark"
      className={`${sans.variable} ${accent.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <JsonLd />
      </head>
      <body className="pa pa-ground">
        <a className="pa-skip pa-btn pa-btn--primary pa-btn--sm" href="#contenu">
          Aller au contenu
        </a>
        <Navigation avecBlog={avecBlog} />
        <main id="contenu">{children}</main>
        <CtaBand />
        <Footer />
      </body>
    </html>
  );
}
