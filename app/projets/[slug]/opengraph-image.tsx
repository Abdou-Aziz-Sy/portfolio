import { getProjet, getProjets } from "@/lib/content";
import { imagePartage, ogTaille } from "@/lib/og";

export const alt = "Étude de cas d'Abdou Aziz Sy";
export const size = ogTaille;
export const contentType = "image/png";

export function generateStaticParams() {
  return getProjets().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projet = getProjet(slug);
  const numero = String(projet?.dossier ?? 0).padStart(2, "0");
  return imagePartage({
    meta: `DOSSIER ${numero} — ${(projet?.titre ?? "").toUpperCase()}`,
    titre: projet?.titre ?? "Projet",
    sousTitre: projet?.accroche,
  });
}
