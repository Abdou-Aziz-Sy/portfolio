import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
// @ts-expect-error — module ESM sans déclaration de types
import { porterCss } from "../../scripts/port-css.mjs";

const source = readFileSync(path.join(__dirname, "../../docs/design/components/bundle.css"), "utf8");
const css: string = porterCss(source);

describe("porterCss", () => {
  it("retire l'import des polices Google", () => {
    expect(css).not.toContain("fonts.googleapis.com");
  });
  it("ne laisse aucun sélecteur .pa-m", () => {
    expect(css).not.toMatch(/\.pa-m\s/);
  });
  it("place les règles mobiles dans une requête média, après le palier tablette", () => {
    const tablette = css.indexOf("@media (max-width: 1023px)");
    const mobile = css.indexOf("@media (max-width: 767px)");
    expect(tablette).toBeGreaterThan(0);
    expect(mobile).toBeGreaterThan(tablette);
    expect(css.slice(mobile)).toContain(".pa-hero { font-size: 38px; line-height: 44px; }");
    expect(css.slice(mobile)).toContain(".pa-grid, .pa-grid--2 { grid-template-columns: 1fr;");
  });
});
