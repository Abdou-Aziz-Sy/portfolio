import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NOEUDS_UGB, SEGMENTS_UGB, UgbLinkDiagram, type NoeudUgb } from "@/components/diagrams/UgbLinkDiagram";

/** Extrait, depuis le HTML rendu, chaque groupe `<g data-flux="…">` et son `data-relie`. */
function segmentsRendus(html: string) {
  const balises = html.match(/<g\b[^>]*>/g) ?? [];
  const segments: { id: string; relie: string[] }[] = [];
  for (const balise of balises) {
    const idFlux = balise.match(/data-flux="([^"]*)"/);
    if (!idFlux) continue;
    const relie = balise.match(/data-relie="([^"]*)"/);
    segments.push({ id: idFlux[1], relie: relie ? relie[1].split(" ").filter(Boolean) : [] });
  }
  return segments;
}

describe("UgbLinkDiagram", () => {
  const html = renderToStaticMarkup(<UgbLinkDiagram />);
  const segments = segmentsRendus(html);

  it("expose chaque bloc comme un nœud nommé", () => {
    for (const id of NOEUDS_UGB) expect(html).toContain(`data-noeud="${id}"`);
    expect(NOEUDS_UGB).toHaveLength(12);
  });

  it("chaque groupe de flux porte un data-relie non vide, fait de nœuds existants", () => {
    expect(segments.length).toBeGreaterThan(0);
    for (const segment of segments) {
      expect(segment.relie.length).toBeGreaterThan(0);
      for (const id of segment.relie) {
        expect(NOEUDS_UGB).toContain(id as NoeudUgb);
      }
    }
  });

  it("SEGMENTS_UGB correspond exactement aux groupes rendus (mêmes ids, mêmes listes reliées)", () => {
    const idsRendus = segments.map((s) => s.id).toSorted();
    const idsAttendus = SEGMENTS_UGB.map((s) => s.id).toSorted();
    expect(idsRendus).toEqual(idsAttendus);

    for (const segment of SEGMENTS_UGB) {
      const rendu = segments.find((s) => s.id === segment.id);
      expect(rendu, `groupe rendu introuvable pour ${segment.id}`).toBeDefined();
      expect(rendu!.relie.toSorted()).toEqual(segment.relie.toSorted());
    }
  });

  it("le tronc api-bus relie l'API à ses quatre services", () => {
    const bus = SEGMENTS_UGB.find((s) => s.id === "api-bus");
    expect(bus).toBeDefined();
    expect(bus!.relie.toSorted()).toEqual(["api", "minio", "ollama", "postgresql", "redis"]);
  });

  it("chaque nœud, sauf éventuellement front s'il n'a qu'une relation, apparaît dans au moins un segment", () => {
    const noeudsRelies = new Set(SEGMENTS_UGB.flatMap((s) => s.relie));
    const noeudsSansRelation = NOEUDS_UGB.filter((id) => !noeudsRelies.has(id));
    expect(noeudsSansRelation).toEqual([]);
  });
});
