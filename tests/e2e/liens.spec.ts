import { expect, test } from "@playwright/test";

const PAGES = ["/", "/projets", "/projets/ugb-link", "/projets/gamecupsn", "/a-propos"];

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
  for (const chemin of PAGES) {
    await page.goto(chemin);
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(deborde, chemin).toBe(false);
  }
});

test("les images de partage sont servies", async ({ request }) => {
  for (const url of ["/opengraph-image", "/projets/ugb-link/opengraph-image"]) {
    const reponse = await request.get(url);
    expect(reponse.status(), url).toBe(200);
    expect(reponse.headers()["content-type"]).toContain("image/png");
  }
});
