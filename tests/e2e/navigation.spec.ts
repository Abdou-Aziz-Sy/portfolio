import { expect, test } from "@playwright/test";

const PAGES = ["/", "/projets", "/projets/ugb-link", "/projets/plusutra", "/a-propos"];

test.describe("pages principales", () => {
  for (const chemin of PAGES) {
    test(`${chemin} répond et porte un titre`, async ({ page }) => {
      const reponse = await page.goto(chemin);
      expect(reponse?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Abdou Aziz Sy/);
    });
  }

  test("aucun contenu fictif ni affirmation corrigée n'apparaît", async ({ page }) => {
    for (const chemin of PAGES) {
      await page.goto(chemin);
      const texte = await page.locator("body").innerText();
      expect(texte, chemin).not.toContain("À remplir");
      expect(texte, chemin).not.toContain("worker-ia");
      expect(texte, chemin).not.toContain("adresse@exemple.sn");
      expect(texte, chemin).not.toContain("dossiers de candidature");
    }
  });

  test("le bandeau de contact est joignable et propose l'e-mail et le CV", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="#contact"]').first()).toBeAttached();
    const contact = page.locator("#contact");
    await expect(contact.getByRole("link", { name: /Me contacter/ })).toHaveAttribute(
      "href",
      "mailto:abdouazizsy@esp.sn",
    );
    await expect(contact.getByRole("link", { name: /Télécharger le CV/ })).toHaveAttribute("href", "/cv.pdf");
  });

  test("le blog reste masqué tant qu'aucun article n'est publié", async ({ page }) => {
    const reponse = await page.goto("/blog");
    expect(reponse?.status()).toBe(404);
    await page.goto("/");
    await expect(page.locator('header a[href="/blog"]')).toHaveCount(0);
  });

  test("une page inconnue renvoie la page 404 du site", async ({ page }) => {
    const reponse = await page.goto("/nexiste-pas");
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /Cette page n'existe pas/ })).toBeVisible();
  });

  test("le CV se télécharge", async ({ request }) => {
    const reponse = await request.get("/cv.pdf");
    expect(reponse.status()).toBe(200);
    expect(reponse.headers()["content-type"]).toContain("application/pdf");
  });
});

test.describe("menu mobile", () => {
  test("ouvre et ferme la navigation", async ({ page, isMobile }) => {
    test.skip(!isMobile, "réservé au gabarit mobile");
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("navigation", { name: "Principale (mobile)" }).getByRole("link", { name: "Projets" }).click();
    await expect(page).toHaveURL(/\/projets$/);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });
});
