export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "URL du site absente en production : définir NEXT_PUBLIC_SITE_URL ou VERCEL_PROJECT_PRODUCTION_URL.",
    );
  }
  return "http://localhost:3000";
}
