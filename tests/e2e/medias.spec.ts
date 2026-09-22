import { expect, test } from "@playwright/test";

const URL_UGB = "/projets/ugb-link";

test.describe("médias de l'étude de cas UGB Link", () => {
  test("les captures se chargent réellement, pas seulement leur balise", async ({ page }) => {
    await page.goto(URL_UGB);
    const captures = page.getByTestId("capture");
    expect(await captures.count()).toBeGreaterThanOrEqual(8);
    for (const capture of await captures.all()) {
      const image = capture.locator("button img");
      await image.scrollIntoViewIfNeeded();
      // 30 s et non 10 : sur un build neuf (toujours le cas en CI), l'optimiseur de Next convertit
      // chaque capture de 1920 px à la première demande ; mesuré à plus de 10 s pour la première,
      // 1,3 s pour le test entier une fois le cache rempli.
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 30_000 })
        .toBe(true);
    }
  });

  test("une capture s'agrandit, se ferme avec Échap et rend le focus", async ({ page }) => {
    await page.goto(URL_UGB);
    const bouton = page.getByTestId("capture").first().getByRole("button");
    await bouton.scrollIntoViewIfNeeded();
    await bouton.click();
    const dialogue = page.getByRole("dialog");
    await expect(dialogue).toBeVisible();
    await expect
      .poll(() => dialogue.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialogue).toBeHidden();
    await expect(bouton).toBeFocused();
  });

  test("un clic sur le fond ferme l'agrandissement", async ({ page }) => {
    await page.goto(URL_UGB);
    const bouton = page.getByTestId("capture").first().getByRole("button");
    await bouton.scrollIntoViewIfNeeded();
    await bouton.click();
    const dialogue = page.getByRole("dialog");
    await expect(dialogue).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(dialogue).toBeHidden();
  });

  test("la vidéo du parcours a une affiche, des contrôles et aucun son", async ({ page }) => {
    await page.goto(URL_UGB);
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("poster", /parcours-candidature\.jpg$/);
    await expect(video).toHaveAttribute("controls", "");
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  });

  test("avec les animations réduites, la vidéo ne démarre pas seule", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(URL_UGB);
    const video = page.locator("video");
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("le logo du commanditaire accompagne l'en-tête de l'étude", async ({ page }) => {
    await page.goto(URL_UGB);
    const logo = page.locator("header").getByRole("img", { name: /Université Gaston Berger/ });
    await expect(logo).toBeVisible();
  });
});

test("le dossier Gestion de stages montre le dépôt d'une candidature", async ({ page }) => {
  await page.goto("/projets/gestion-stage");
  const schema = page.locator('img[src*="gestion-stage-candidature"]');
  await expect(schema).toHaveAttribute("alt", /.{80,}/);
  await schema.scrollIntoViewIfNeeded();
  await expect.poll(() => schema.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});
