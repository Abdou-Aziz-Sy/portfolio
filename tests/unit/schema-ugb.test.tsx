import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FLUX_UGB, NOEUDS_UGB, UgbLinkDiagram } from "@/components/diagrams/UgbLinkDiagram";

describe("UgbLinkDiagram", () => {
  const html = renderToStaticMarkup(<UgbLinkDiagram />);

  it("expose chaque bloc comme un nœud nommé", () => {
    for (const id of NOEUDS_UGB) expect(html).toContain(`data-noeud="${id}"`);
    expect(NOEUDS_UGB).toHaveLength(12);
  });

  it("expose chaque flux avec ses extrémités et son ordre", () => {
    for (const f of FLUX_UGB) {
      expect(html).toContain(`data-flux="${f.de}-${f.vers}"`);
      expect(NOEUDS_UGB).toContain(f.de);
    }
  });
});
