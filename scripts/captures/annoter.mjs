// Annotations de captures d'écran, posées dans la page juste avant la prise de vue.
//
// Chaque annotation encadre un élément (sélecteur Playwright) et y accroche une étiquette. Le
// style reprend celui des captures annotées à la main d'UGB Link (cadre vert, texte sombre), pour
// que les études de cas gardent une même écriture d'un projet à l'autre.
//
//   await annoter(page, [{ cible: page.getByText("Mardi"), texte: "Semaine type", cote: "haut" }]);
//   await page.screenshot({ ... });
//   await effacerAnnotations(page);

const VERT = "#16a34a";

/** @param {import("@playwright/test").Page} page */
export async function annoter(page, annotations) {
  const boites = [];
  for (const a of annotations) {
    const cible = a.cible.first();
    await cible.waitFor({ state: "visible" });
    const b = await cible.boundingBox();
    if (!b) throw new Error(`annotation sans cible visible : ${a.texte}`);
    boites.push({ ...b, texte: a.texte, cote: a.cote ?? "haut", marge: a.marge ?? 6 });
  }
  await page.evaluate(
    ({ boites, VERT }) => {
      const calque = document.createElement("div");
      calque.id = "annotations-portfolio";
      calque.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;";
      for (const b of boites) {
        const x = b.x + scrollX - b.marge;
        const y = b.y + scrollY - b.marge;
        const l = b.width + 2 * b.marge;
        const h = b.height + 2 * b.marge;
        const cadre = document.createElement("div");
        cadre.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${l}px;height:${h}px;border:2.5px solid ${VERT};border-radius:8px;box-sizing:border-box;`;
        const etiquette = document.createElement("div");
        etiquette.textContent = b.texte;
        etiquette.style.cssText = `position:absolute;white-space:nowrap;font:600 17px/1.2 system-ui,sans-serif;color:#10202f;background:#fff;border:2px solid ${VERT};border-radius:6px;padding:5px 10px;box-shadow:0 2px 6px rgb(0 0 0/.15);`;
        calque.append(cadre, etiquette);
      }
      document.body.append(calque);
      // La taille d'une étiquette n'est connue qu'une fois dans le document : on la place ensuite,
      // du côté demandé, sans la laisser sortir de la page.
      [...calque.children].forEach((el, i) => {
        if (i % 2 === 0) return;
        const b = boites[(i - 1) / 2];
        const x = b.x + scrollX - b.marge;
        const y = b.y + scrollY - b.marge;
        const l = b.width + 2 * b.marge;
        const h = b.height + 2 * b.marge;
        const le = el.offsetWidth;
        const he = el.offsetHeight;
        // Bord droit de la zone visible (et non du document, qui peut déborder de la vue).
        const bordDroit = scrollX + document.documentElement.clientWidth - 4;
        // Une étiquette qui ne tient pas à droite passe à gauche plutôt que de recouvrir sa cible.
        const cote = b.cote === "droite" && x + l + 12 + le > bordDroit ? "gauche" : b.cote;
        const pos = { haut: [x, y - he - 8], bas: [x, y + h + 8], gauche: [x - le - 12, y + h / 2 - he / 2], droite: [x + l + 12, y + h / 2 - he / 2] }[cote];
        el.style.left = `${Math.max(scrollX + 4, Math.min(pos[0], bordDroit - le))}px`;
        el.style.top = `${Math.max(4, pos[1])}px`;
      });
    },
    { boites, VERT },
  );
}

/** @param {import("@playwright/test").Page} page */
export async function effacerAnnotations(page) {
  await page.evaluate(() => document.getElementById("annotations-portfolio")?.remove());
}
