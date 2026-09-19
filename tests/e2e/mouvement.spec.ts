import { expect, test, type Page } from "@playwright/test";

export async function animationsInfinies(page: Page) {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.effect?.getTiming().iterations === Infinity)
      .map((a) => (a as CSSAnimation).animationName ?? "?"),
  );
}

export async function animationsEnCours(page: Page) {
  return page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
}

const PAGES = ["/", "/projets", "/projets/ugb-link", "/a-propos"];

test("aucune animation ne tourne en boucle", async ({ page }) => {
  for (const chemin of PAGES) {
    await page.goto(chemin);
    expect(await animationsInfinies(page), chemin).toEqual([]);
  }
});

test("avec le mouvement réduit, aucune animation ne s'exécute et tout est visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const chemin of PAGES) {
    await page.goto(chemin);
    expect(await animationsEnCours(page), chemin).toBe(0);
    const invisibles = await page.evaluate(() =>
      Array.from(document.querySelectorAll("main *"))
        .filter((el) => getComputedStyle(el).opacity === "0" && el.getClientRects().length > 0)
        .map((el) => el.tagName + "." + el.className),
    );
    expect(invisibles, chemin).toEqual([]);
  }
});
