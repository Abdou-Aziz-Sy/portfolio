import type { MetadataRoute } from "next";
import { getArticles, getProjets } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const articles = getArticles().filter((a) => a.publie);
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projets`, changeFrequency: "monthly", priority: 0.9 },
    ...getProjets()
      .filter((p) => p.publie)
      .map((p) => ({ url: `${base}/projets/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${base}/a-propos`, changeFrequency: "yearly", priority: 0.6 },
    ...(articles.length > 0
      ? [
          { url: `${base}/blog`, changeFrequency: "weekly" as const, priority: 0.7 },
          ...articles.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: a.date, priority: 0.6 })),
        ]
      : []),
  ];
}
