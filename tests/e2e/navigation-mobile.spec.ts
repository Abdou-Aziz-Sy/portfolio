import { expect, test } from "@playwright/test";

test.describe("en-tête mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("le bouton Me contacter est dans l'en-tête", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: /Me contacter|Contact/ })).toBeVisible();
  });

  test("le bouton de thème est une cible d'au moins 44 px et garde un nom clair", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByTestId("theme-toggle");
    const nom = await bouton.getAttribute("aria-label");
    expect(nom).toMatch(/Thème (clair|sombre)/);
    const boite = await bouton.boundingBox();
    expect(boite!.width).toBeGreaterThanOrEqual(44);
    expect(boite!.height).toBeGreaterThanOrEqual(44);
  });

  test("le bouton Me contacter ne chevauche pas le logo", async ({ page }) => {
    await page.goto("/");
    const banniere = page.getByRole("banner");
    const logo = banniere.locator("a.pa-mark").first();
    const contact = banniere.getByRole("link", { name: /Me contacter|Contact/ });
    const boiteLogo = await logo.boundingBox();
    const boiteContact = await contact.boundingBox();
    expect(boiteLogo).toBeTruthy();
    expect(boiteContact).toBeTruthy();
    expect(boiteLogo!.x + boiteLogo!.width).toBeLessThanOrEqual(boiteContact!.x);
  });
});

test.describe("nom accessible du bouton de thème (bureau)", () => {
  test.skip(({ isMobile }) => isMobile, "projet bureau uniquement");

  test("le nom accessible contient le texte visible (WCAG 2.5.3)", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByTestId("theme-toggle");
    // textContent (pas innerText) : on compare le texte source, indépendant
    // de la casse imposée visuellement par text-transform: uppercase.
    const texteVisible = ((await bouton.textContent()) ?? "").trim();
    const nom = await bouton.getAttribute("aria-label");
    expect(texteVisible.length).toBeGreaterThan(0);
    expect(nom).toContain(texteVisible);
  });
});
