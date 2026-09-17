import { imagePartage, ogTaille } from "@/lib/og";

export const alt = "Abdou Aziz Sy — ingénieur logiciel à Dakar, orienté backend";
export const size = ogTaille;
export const contentType = "image/png";

export default function Image() {
  return imagePartage({
    meta: "DOSSIER — ABDOU AZIZ SY",
    titre: "Ingénieur logiciel à Dakar",
    sousTitre: "Backend, conception de systèmes et infrastructure",
  });
}
