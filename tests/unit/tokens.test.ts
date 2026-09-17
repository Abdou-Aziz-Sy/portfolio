import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
// @ts-expect-error — module ESM sans déclaration de types
import { renderTokens } from "../../scripts/build-tokens.mjs";

const json = JSON.parse(
  readFileSync(path.join(__dirname, "../../docs/design/tokens.json"), "utf8"),
);
const css: string = renderTokens(json);

function bloc(selecteur: string): string {
  const debut = css.indexOf(selecteur + " {");
  expect(debut, `bloc ${selecteur} absent`).toBeGreaterThanOrEqual(0);
  return css.slice(debut, css.indexOf("}", debut));
}

describe("renderTokens", () => {
  it("place le thème sombre sur :root et le thème clair sur data-theme=light", () => {
    expect(bloc(':root, [data-theme="dark"]')).toContain("--ground: #020a13;");
    expect(bloc('[data-theme="light"]')).toContain("--ground: #f3f5f7;");
  });

  it("déclare les espacements et la mise en page", () => {
    expect(css).toContain("--space-5: 24px;");
    expect(css).toContain("--page-max: 1200px;");
    expect(css).toContain("--radius-1: 3px;");
    expect(css).toContain("--grid-pitch: 24px;");
  });

  it("n'écrit que les couleurs dans les blocs de thème", () => {
    expect(bloc('[data-theme="light"]')).not.toContain("--space-");
  });
});
