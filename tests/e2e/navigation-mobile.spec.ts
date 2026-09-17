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

  test("Échap ferme le menu et rend le focus au bouton", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    const panneau = page.getByRole("navigation", { name: "Principale (mobile)" });
    const premierLien = panneau.getByRole("link").first();
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    // Le focus doit avoir explicitement quitté le bouton avant Échap, sinon
    // le test ne prouve rien (il resterait vert même sans retour de focus).
    await premierLien.focus();
    await expect(premierLien).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    await expect(bouton).toBeFocused();
  });

  test("un clic hors du panneau ferme le menu", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await page.locator("main").click({ position: { x: 10, y: 300 } });
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
  });

  test("cliquer sur le lien Me contacter du panneau ferme le menu sans rendre le focus au bouton", async ({
    page,
  }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    const panneau = page.getByRole("navigation", { name: "Principale (mobile)" });
    const lienContact = panneau.getByRole("link", { name: "Me contacter" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await lienContact.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    await expect(bouton).not.toBeFocused();
  });

  test("cliquer de nouveau sur Menu pendant que le panneau est ouvert le ferme une seule fois", async ({ page }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    // Le pointerdown de fermeture se déclenche avant le click du bouton Menu lui-même :
    // il ne doit ni rouvrir le panneau, ni le fermer deux fois.
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
  });

  test("cliquer sur le bouton de thème pendant que le panneau est ouvert ferme le menu sans avaler le clic", async ({
    page,
  }) => {
    await page.goto("/");
    const bouton = page.getByRole("button", { name: "Menu" });
    const boutonTheme = page.getByTestId("theme-toggle");
    const libelleAvant = await boutonTheme.getAttribute("aria-label");
    await bouton.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await boutonTheme.click();
    await expect(bouton).toHaveAttribute("aria-expanded", "false");
    await expect(boutonTheme).not.toHaveAttribute("aria-label", libelleAvant ?? "");
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
