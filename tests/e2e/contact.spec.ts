import { expect, test } from "@playwright/test";

test("le bandeau de contact donne l'e-mail, GitHub et un bouton Copier", async ({ page, context, browserName }) => {
  await page.goto("/#contact");
  const bandeau = page.locator("#contact");
  await expect(bandeau).toContainText("abdouazizsy@esp.sn");
  await expect(bandeau.getByRole("link", { name: /GitHub/ })).toBeVisible();

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await bandeau.getByRole("button", { name: /Copier/ }).click();
  await expect(bandeau.getByRole("button")).toContainText(/Copié|Copie impossible/);
});

test("un second clic rapproché prolonge le message de confirmation", async ({ page, context, browserName }) => {
  await page.goto("/#contact");
  const bandeau = page.locator("#contact");

  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }

  // Locator stable indépendant du libellé : « Copier » filtré par nom ne
  // correspondrait plus une fois le bouton passé en état de confirmation.
  const bouton = bandeau.getByRole("button");
  await bouton.click();
  await page.waitForTimeout(1200);
  await bouton.click();
  // 2,2 s après le premier clic (donc après ses 2 s), mais 1 s après le second
  // clic (donc avant la fin de ses 2 s) : le message doit encore être affiché.
  await page.waitForTimeout(1000);
  await expect(bouton).toContainText(/Copié|Copie impossible/);
});
