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

test("les pages ne défilent pas horizontalement", async ({ page }) => {
  for (const chemin of PAGES_TEST) {
    await page.goto(chemin);
    const mesure = await page.evaluate(() => ({
      defile: document.documentElement.scrollWidth,
      visible: document.documentElement.clientWidth,
    }));
    // clientWidth, et non innerWidth : en émulation mobile, innerWidth grandit avec la page
    // et le test ne peut jamais échouer.
    expect(mesure.defile, `${chemin} (${mesure.defile} > ${mesure.visible})`).toBeLessThanOrEqual(mesure.visible);
  }
});

test("les images de partage sont servies", async ({ request }) => {
  for (const url of ["/opengraph-image", "/projets/ugb-link/opengraph-image"]) {
    const reponse = await request.get(url);
    expect(reponse.status(), url).toBe(200);
    expect(reponse.headers()["content-type"]).toContain("image/png");
  }
});
