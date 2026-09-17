import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site-url";

const sauvegarde = { ...process.env };

afterEach(() => {
  process.env = { ...sauvegarde };
});

describe("siteUrl", () => {
  it("préfère la variable explicite et retire la barre finale", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://exemple.sn/";
    expect(siteUrl()).toBe("https://exemple.sn");
  });

  it("utilise l'URL de production Vercel", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "portfolio.vercel.app";
    expect(siteUrl()).toBe("https://portfolio.vercel.app");
  });

  it("échoue en production quand aucune URL n'est définie", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    process.env.VERCEL_ENV = "production";
    expect(() => siteUrl()).toThrow(/URL/i);
  });

  it("retombe sur localhost hors production", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_ENV;
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
