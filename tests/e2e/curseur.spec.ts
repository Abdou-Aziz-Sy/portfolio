import { expect, test } from "@playwright/test";

/** Déplace le pointeur au milieu de la première vue, en plusieurs pas (un seul saut peut ne
 *  produire aucun `pointermove` intermédiaire). */
async function survolerLaPremiereVue(page: import("@playwright/test").Page) {
  const zone = await page.locator(".pa-accueil-haut").boundingBox();
  if (!zone) throw new Error("première vue introuvable");
  await page.mouse.move(zone.x + 20, zone.y + 20);
  await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height / 2, { steps: 8 });
  return zone;
}

test.describe("halo du curseur sur l'accueil", () => {
  test("la grille s'allume là où se trouve le pointeur", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "pas de pointeur fin sur mobile");
    await page.goto("/");
    const halo = page.getByTestId("halo-curseur");
    await expect(halo).toHaveAttribute("data-actif", "0");
    const boite = await page.locator(".pa-accueil-haut").boundingBox();
    if (!boite) throw new Error("première vue introuvable");
    // Zone vide de la grille, à droite du titre : l'attribut seul ne prouve pas que le halo se
    // voit (il a été actif mais peint sous le fond de <body>) ; on compare donc les pixels.
    const clip = { x: boite.x + boite.width / 2 - 60, y: boite.y + boite.height / 2 - 60, width: 120, height: 120 };
    const avant = await page.screenshot({ clip, animations: "disabled" });
    const zone = await survolerLaPremiereVue(page);
    await expect(halo).toHaveAttribute("data-actif", "1");
    await page.waitForTimeout(500); // fin du fondu d'opacité
    const apres = await page.screenshot({ clip, animations: "disabled" });
    expect(apres.equals(avant)).toBe(false);
    const x = await halo.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--x")));
    expect(Math.abs(x - (zone.x + zone.width / 2))).toBeLessThan(2);
    // En quittant la première vue, le halo s'éteint.
    await page.mouse.move(zone.x + zone.width / 2, zone.y + zone.height + 300, { steps: 4 });
    await expect(halo).toHaveAttribute("data-actif", "0");
  });

  test("le calque ne capte aucun clic", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "pas de pointeur fin sur mobile");
    await page.goto("/");
    await survolerLaPremiereVue(page);
    await expect(page.getByTestId("halo-curseur")).toHaveCSS("pointer-events", "none");
  });

  test("avec les animations réduites, le halo reste éteint", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "pas de pointeur fin sur mobile");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await survolerLaPremiereVue(page);
    await page.waitForTimeout(300);
    await expect(page.getByTestId("halo-curseur")).toHaveAttribute("data-actif", "0");
  });

  test("sur écran tactile, le halo reste éteint", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "concerne l'émulation tactile");
    await page.goto("/");
    // Le surtitre, pas un point arbitraire : un toucher sur un lien du titre changerait de page.
    await page.getByTestId("surtitre-identite").tap();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("halo-curseur")).toHaveAttribute("data-actif", "0");
  });
});
