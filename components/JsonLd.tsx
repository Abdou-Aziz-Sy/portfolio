import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";

export function JsonLd() {
  const personne = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.nom,
    jobTitle: site.metier,
    email: `mailto:${site.email}`,
    url: siteUrl(),
    address: { "@type": "PostalAddress", addressLocality: "Dakar", addressCountry: "SN" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "École Supérieure Polytechnique de Dakar" },
    sameAs: Object.values(site.liens).filter((lien): lien is string => Boolean(lien)),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personne).replace(/</g, "\\u003c") }}
    />
  );
}
