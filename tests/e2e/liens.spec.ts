import { expect, test } from "@playwright/test";

export const PAGES_TEST = [
  "/",
  "/projets",
  "/projets/ugb-link",
  "/projets/gamecupsn",
  "/projets/hackathon-mcn",
  "/projets/plusutra",
  "/a-propos",
  "/page-qui-nexiste-pas",
];

const PAGES = PAGES_TEST.filter((c) => c !== "/page-qui-nexiste-pas");

test("aucun lien interne n'est cassé", async ({ page, request }) => {
  const liens = new Set<string>();
  for (const chemin of PAGES) {
    await page.goto(chemin);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    hrefs.forEach((h) => liens.add(h.split("#")[0]));
  }
  expect(liens.size).toBeGreaterThan(5);
  for (const lien of liens) {
    const reponse = await request.get(lien);
    expect(reponse.status(), lien).toBeLessThan(400);
  }
});

async function verifiePasDeDefilement(page: import("@playwright/test").Page, suffixe = "") {
  for (const chemin of PAGES_TEST) {
    await page.goto(chemin);
    const mesure = await page.evaluate(() => ({
      defile: document.documentElement.scrollWidth,
      visible: document.documentElement.clientWidth,
    }));
    // clientWidth, et non innerWidth : en émulation mobile, innerWidth grandit avec la page
    // et le test ne peut jamais échouer.
    expect(mesure.defile, `${chemin}${suffixe} (${mesure.defile} > ${mesure.visible})`).toBeLessThanOrEqual(
      mesure.visible,
    );
  }
}

test("les pages ne défilent pas horizontalement", async ({ page }) => {
  await verifiePasDeDefilement(page);
});

// Critère de réussite de la spec : aucun défilement horizontal entre 320 et 2560 px,
// ni à 200 % de zoom sur 1280 px (équivalent à une largeur de rendu de 640 px).
// Un seul projet (chromium) suffit : le test par défaut ci-dessus couvre déjà les
// deux projets (bureau et mobile) à leur largeur habituelle ; répéter ces largeurs
// supplémentaires sur « mobile » ne ferait que dupliquer le travail.
const LARGEURS_CRITERE = [320, 640, 2560];

for (const largeur of LARGEURS_CRITERE) {
  test(`les pages ne défilent pas horizontalement à ${largeur}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "couvert une seule fois, sur chromium");
    await page.setViewportSize({ width: largeur, height: 900 });
    await verifiePasDeDefilement(page, ` à ${largeur}px`);
  });
}

test("les images de partage sont servies", async ({ request }) => {
  for (const url of ["/opengraph-image", "/projets/ugb-link/opengraph-image"]) {
    const reponse = await request.get(url);
    expect(reponse.status(), url).toBe(200);
    expect(reponse.headers()["content-type"]).toContain("image/png");
  }
});

test("la section vedette s'empile sur mobile", async ({ page }) => {
  const viewportSize = page.viewportSize();
  const viewportWidth = viewportSize?.width ?? 0;
  test.skip(viewportWidth > 800, "Test réservé au profil mobile (viewport < 800px)");
  await page.goto("/");
  const paFeature = page.locator(".pa-feature").first();
  await expect(paFeature).toHaveCount(1);
  const gridColumns = await paFeature.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return computed.gridTemplateColumns;
  });
  // Sur mobile (viewport 412px), gridTemplateColumns doit être « minmax(0px, 1fr) »
  // (une seule piste), pas « minmax(0px, 5fr) minmax(0px, 7fr) » (deux pistes).
  const colonnes = gridColumns.split(" ").filter((v) => v.trim());
  expect(colonnes.length, `gridTemplateColumns: ${gridColumns}`).toBe(1);
});
