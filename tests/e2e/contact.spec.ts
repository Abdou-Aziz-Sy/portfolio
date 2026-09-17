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
