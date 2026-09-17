import { describe, expect, it } from "vitest";
import { tempsDeLecture } from "@/lib/reading-time";

const mots = (n: number) => Array.from({ length: n }, () => "mot").join(" ");

describe("tempsDeLecture", () => {
  it("compte une minute pour 220 mots", () => expect(tempsDeLecture(mots(220))).toBe(1));
  it("arrondit au-dessus", () => expect(tempsDeLecture(mots(221))).toBe(2));
  it("renvoie au moins une minute", () => expect(tempsDeLecture("")).toBe(1));
  it("ignore la syntaxe MDX et le code", () => {
    expect(tempsDeLecture(`${mots(220)}\n<Callout titre="x" />\n\`\`\`\n${mots(500)}\n\`\`\``)).toBe(1);
  });
});
