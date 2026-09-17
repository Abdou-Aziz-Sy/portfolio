import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "@/lib/site-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("préfère la variable explicite et retire la barre finale", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.sn/");
    // Assurer que les autres variables ne sont pas définies
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(siteUrl()).toBe("https://exemple.sn");
  });

  it("utilise l'URL de production Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "portfolio.vercel.app");
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(siteUrl()).toBe("https://portfolio.vercel.app");
  });

  it("échoue en production quand aucune URL n'est définie", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => siteUrl()).toThrow(/URL/i);
  });

  it("retombe sur localhost hors production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", undefined);
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
