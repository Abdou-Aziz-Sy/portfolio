import { ImageResponse } from "next/og";

export const ogTaille = { width: 1200, height: 630 };

const FOND = "#020a13";
const GRILLE = "rgba(127, 179, 224, 0.08)";

/** Visuel de partage au style « plan d'architecte ». */
export function imagePartage({ meta, titre, sousTitre }: { meta: string; titre: string; sousTitre?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: FOND,
          backgroundImage: `linear-gradient(${GRILLE} 1px, transparent 1px), linear-gradient(90deg, ${GRILLE} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          color: "#e1e1e1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: "#8c9299" }}>{meta}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            {titre}
            <span style={{ color: "#7fb3e0" }}>.</span>
          </div>
          {sousTitre ? <div style={{ display: "flex", fontSize: 30, color: "#9e9e9c" }}>{sousTitre}</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#8c9299" }}>
          <span style={{ fontWeight: 800, fontSize: 34, color: "#e1e1e1" }}>
            AAS<span style={{ color: "#7fb3e0" }}>.</span>
          </span>
          <span>DAKAR, SN</span>
        </div>
      </div>
    ),
    ogTaille,
  );
}
