const MOTS_PAR_MINUTE = 220;

/** Minutes de lecture d'un corps MDX, sans compter les blocs de code ni les balises de composants. */
export function tempsDeLecture(texte: string): number {
  const prose = texte
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ");
  const mots = prose.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  return Math.max(1, Math.ceil(mots / MOTS_PAR_MINUTE));
}
