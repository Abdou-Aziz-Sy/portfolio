import { expect, test } from "@playwright/test";

test("le nom complet est visible en haut de l'accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Abdou Aziz Sy");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Ingénieur logiciel");
});

test("le logo annonce le nom complet aux lecteurs d'écran", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("banner").getByRole("link", { name: /Abdou Aziz Sy/ });
  await expect(logo).toBeVisible();

  // Vérifie que le nom accessible contient le texte visible (WCAG 2.5.3)
  // Récupère le texte du span actuellement visible (pas le lien entier)
  const visibleText = await logo.evaluate((el) => {
    if (!(el instanceof HTMLElement)) return "";

    // Cherche le span visible (court ou long selon le viewport)
    const court = el.querySelector(".pa-mark-court");
    const long = el.querySelector(".pa-mark-long");

    if (!court || !long) return el.textContent?.trim() || "";

    // Récupère le texte du span non-masqué visuellement
    const courtStyle = window.getComputedStyle(court);

    if (courtStyle.position === "static" || courtStyle.width !== "1px") {
      return (court.textContent || "").trim();
    } else {
      return (long.textContent || "").trim();
    }
  });

  const accessibleName = await logo.getAttribute("aria-label") || await logo.textContent() || "";
  expect(accessibleName).toContain(visibleText);
});
