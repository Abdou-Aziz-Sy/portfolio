import { expect, test, type Page } from "@playwright/test";

function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: number[], b: number[]) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const lire = (s: string) => s.match(/\d+/g)!.slice(0, 3).map(Number);

/**
 * Le séparateur de métadonnées (`.pa-sep`) s'affiche sur la carte de projet
 * (fond `--surface`), pas sur le fond de la page (`--ground` de `body`) : on
 * compare donc au fond réel de son conteneur, pas à celui de `body`.
 */
async function contrasteSeparateur(page: Page) {
  return page.locator(".pa-meta .pa-sep").first().evaluate((el) => {
    const style = getComputedStyle(el);
    const conteneur = el.closest(".pa-surface") ?? document.body;
    const fond = getComputedStyle(conteneur).backgroundColor;
    return { texte: style.color, fond };
  });
}

test.describe("contraste des séparateurs de métadonnées", () => {
  test("atteint 4,5:1 en thème sombre (par défaut)", async ({ page }) => {
    await page.goto("/projets");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const couleurs = await contrasteSeparateur(page);
    expect(contraste(lire(couleurs.texte), lire(couleurs.fond))).toBeGreaterThanOrEqual(4.5);
  });

  test("atteint 4,5:1 en thème clair", async ({ page }) => {
    await page.goto("/projets");
    await page.getByTestId("theme-toggle").click();
    // Un rechargement laisse le temps à la transition de fond (`.pa-card`) de se
    // terminer avant la mesure, au lieu de lire une couleur intermédiaire.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const couleurs = await contrasteSeparateur(page);
    expect(contraste(lire(couleurs.texte), lire(couleurs.fond))).toBeGreaterThanOrEqual(4.5);
  });
});

// Le cartouche affiche soit le portrait, soit les initiales en repli (Frame.tsx) : les deux
// états doivent porter un nom accessible qui nomme la personne. Le test accepte l'un ou l'autre
// pour rester vrai le jour où une photo est ajoutée ou retirée.
test("le cartouche est nommé correctement", async ({ page }) => {
  await page.goto("/a-propos");
  const cartouche = page.locator("figure.pa-frame").getByRole("img", { name: /Abdou Aziz Sy/ });
  await expect(cartouche).toHaveCount(1);
  const nom = await cartouche.evaluate((el) => el.getAttribute("alt") ?? el.getAttribute("aria-label") ?? "");
  expect(nom).toMatch(/^(Portrait de|Initiales d')/);
});

test("la pastille d'une décision acceptée ne pulse pas (statut stable)", async ({ page }) => {
  await page.goto("/projets/ugb-link");
  const nomAnimation = await page
    .locator(".pa-adr .pa-dot.is-accepte")
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(nomAnimation).toBe("none");
});

test("le titre du dossier ne provoque pas de débordement horizontal à 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/projets/hackathon-mcn");
  const mesure = await page.evaluate(() => ({
    defile: document.documentElement.scrollWidth,
    visible: document.documentElement.clientWidth,
  }));
  expect(mesure.defile, `${mesure.defile} > ${mesure.visible}`).toBeLessThanOrEqual(mesure.visible);
});
