import { expect, test } from "@playwright/test";

test("le nom complet est visible en haut de l'accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Abdou Aziz Sy");
  await expect(page.getByTestId("surtitre-identite")).toContainText("Ingénieur logiciel");
});

test("le logo annonce un nom accessible propre, identique au texte visible", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("banner").locator(".pa-mark");
  await expect(logo).toBeVisible();

  // Repère le span réellement rendu (largeur non nulle), qu'il soit masqué par
  // `display: none` ou par la technique de clip — pas par une hypothèse sur la
  // technique de masquage utilisée.
  const texteVisible = await logo.evaluate((el) => {
    const court = el.querySelector<HTMLElement>(".pa-mark-court");
    const long = el.querySelector<HTMLElement>(".pa-mark-long");
    const largeur = (n: HTMLElement | null) => (n ? n.getBoundingClientRect().width : 0);
    const rendu = largeur(court) > largeur(long) ? court : long;
    return (rendu?.textContent ?? "").trim();
  });
  expect(texteVisible.length).toBeGreaterThan(0);

  // Le nom accessible doit être EXACTEMENT le texte visible : ni un aria-label
  // divergent, ni la concaténation des deux variantes (ex. « AAS.Abdou Aziz Sy »).
  await expect(logo).toHaveAccessibleName(texteVisible);
});

test("le titre de l'accueil ne mentionne pas le blog tant qu'aucun article n'est publié", async ({ page }) => {
  await page.goto("/");
  // Contenu actuel : les trois articles de content/blog/ sont tous publie: false.
  const h1 = page.locator("h1.pa-hero");
  await expect(h1).toContainText("avant de les coder.");
  await expect(h1).not.toContainText("ce que j'apprends");
});

test("le pied de page annonce la disponibilité, pas un faux statut de service", async ({ page }) => {
  await page.goto("/");
  const pied = page.getByRole("contentinfo");
  await expect(pied).toContainText("Disponible pour un poste · Dakar ou à distance");
  await expect(pied).not.toContainText("services opérationnels");
});

// Ne cible que la ou les pastilles associées au texte « Disponible », pas les
// autres pastilles de statut (ex. « En production ») qui, elles, pulsent
// légitimement. Le repérage se fait par le texte du parent, pas par une classe
// d'implémentation, pour rester robuste à un refactor du balisage.
async function animationsPastillesDispo(page: import("@playwright/test").Page, racine: string) {
  return page.evaluate((selecteurRacine) => {
    const racine = document.querySelector(selecteurRacine);
    if (!racine) return [];
    return Array.from(racine.querySelectorAll<HTMLElement>(".pa-dot"))
      .filter((dot) => (dot.parentElement?.textContent ?? "").includes("Disponible"))
      .map((dot) => window.getComputedStyle(dot).animationName);
  }, racine);
}

function attendPasAnimee(noms: string[]) {
  expect(noms.length).toBeGreaterThan(0);
  for (const nom of noms) {
    expect(["none", ""], `animationName inattendu : ${nom}`).toContain(nom);
  }
}

test("aucune pastille de disponibilité ne pulse, sur aucune page", async ({ page }) => {
  await page.goto("/");
  attendPasAnimee(await animationsPastillesDispo(page, "main"));
  attendPasAnimee(await animationsPastillesDispo(page, "footer"));

  await page.goto("/a-propos");
  attendPasAnimee(await animationsPastillesDispo(page, "main"));
});
