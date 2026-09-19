import { expect, test } from "@playwright/test";
import { site } from "../../content/site";

/** Taille de police réellement rendue d'un texte SVG : taille déclarée × échelle du SVG. */
async function taillesRendues(svg: import("@playwright/test").Locator, selecteur = "text") {
  return svg.evaluate((el, sel) => {
    const s = el as SVGSVGElement;
    const echelle = s.getBoundingClientRect().width / s.viewBox.baseVal.width;
    return Array.from(s.querySelectorAll(sel)).map((t) => parseFloat(getComputedStyle(t).fontSize) * echelle);
  }, selecteur);
}

test("le schéma de la carte vedette reste lisible (texte d'au moins 11 px)", async ({ page }) => {
  await page.goto("/");
  const tailles = await taillesRendues(page.locator(".pa-feature-fig svg").first());
  expect(tailles.length).toBeGreaterThan(0);
  expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
  await expect(page.getByRole("link", { name: /Voir le schéma complet/ })).toHaveAttribute(
    "href",
    "/projets/ugb-link#architecture",
  );
});

test("le schéma de la carte vedette reste lisible dès 320 px", async ({ page }) => {
  // Cadre le plus étroit de la fourchette couverte (320 à 2560 px) : le point le plus
  // exigeant pour les sous-libellés (.d-s) du schéma simplifié.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const tailles = await taillesRendues(page.locator(".pa-feature-fig svg").first());
  expect(tailles.length).toBeGreaterThan(0);
  expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
});

test.describe("mise en page fluide", () => {
  test.skip(({ isMobile }) => isMobile, "largeurs pilotées explicitement : projet bureau seulement");

  test("le contenu occupe jusqu'à 1 920 px sur un écran de 2 560 px", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    const largeurUtile = await page.locator("main .pa-wrap").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    });
    expect(largeurUtile).toBeGreaterThanOrEqual(1900);
    expect(largeurUtile).toBeLessThanOrEqual(1920);
  });

  test("les marges latérales suivent la largeur de l'écran", async ({ page }) => {
    const marges: number[] = [];
    for (const largeur of [375, 1440, 2560]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto("/");
      marges.push(
        await page.locator("main .pa-wrap").first().evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft)),
      );
    }
    expect(marges[0]).toBe(16);
    expect(marges[1]).toBeCloseTo(57.6, 0);
    expect(marges[2]).toBe(96);
  });

  test("les titres grandissent avec l'écran", async ({ page }) => {
    const tailles: Record<number, number> = {};
    for (const largeur of [375, 1440, 2560]) {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto("/");
      tailles[largeur] = await page.locator("h1.pa-hero").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    }
    expect(tailles[375]).toBeCloseTo(34, 0);
    expect(tailles[2560]).toBeCloseTo(84, 0);
    expect(tailles[1440]).toBeGreaterThan(tailles[375]);
    expect(tailles[1440]).toBeLessThan(tailles[2560]);
  });

  test("le texte courant garde sa hauteur de ligne d'avant la refonte (26 px à 16 px de police)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });

    await page.goto("/projets");
    // /projets sert d'abord ProjectGridStatique (fallback du <Suspense>, sans data-testid
    // "compteur") puis l'hydratation la remplace par ProjectGrid (qui le porte) : attendre ce
    // repère avant de mesurer évite de lire une valeur prise pendant cet échange de DOM.
    await expect(page.getByTestId("compteur")).toBeVisible();
    const hauteurCardFoot = await page
      .locator(".pa-card-foot")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));

    await page.goto("/a-propos");
    const hauteurInitiales = await page
      .locator(".pa-initiales")
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));

    expect(hauteurCardFoot).toBeCloseTo(26, 0);
    expect(hauteurInitiales).toBeCloseTo(26, 0);
  });

  // Avec auto-fit, les pistes surnuméraires sont conservées dans gridTemplateColumns mais
  // réduites à 0 px : on ne compte que les pistes réellement occupées.
  async function colonnes(page: import("@playwright/test").Page, selecteur: string) {
    return page
      .locator(selecteur)
      .first()
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").filter((piste) => parseFloat(piste) > 0).length,
      );
  }

  test("la grille de projets passe à quatre colonnes sur grand écran", async ({ page }) => {
    // Même repère qu'au test précédent : attendre l'hydratation (data-testid "compteur",
    // absent du fallback ProjectGridStatique) avant de mesurer la grille.
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/projets");
    await expect(page.getByTestId("compteur")).toBeVisible();
    expect(await colonnes(page, ".pa-grid-projets")).toBe(4);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/projets");
    await expect(page.getByTestId("compteur")).toBeVisible();
    expect(await colonnes(page, ".pa-grid-projets")).toBe(3);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/projets");
    await expect(page.getByTestId("compteur")).toBeVisible();
    expect(await colonnes(page, ".pa-grid-projets")).toBe(1);
  });

  test("les domaines passent sur deux colonnes en tablette", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto("/");
    expect(await colonnes(page, ".pa-domains")).toBe(2);
  });

  test("la grille « Autres dossiers » de l'accueil n'a pas de piste vide à 1 920 px", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const grille = page.locator('section[aria-labelledby="titre-projets"] .pa-grid');
    const droiteGrille = await grille.evaluate((el) => el.getBoundingClientRect().right);
    const droiteDerniereCarte = await grille
      .locator(":scope > *")
      .last()
      .evaluate((el) => el.getBoundingClientRect().right);
    expect(Math.abs(droiteGrille - droiteDerniereCarte)).toBeLessThanOrEqual(2);
  });

  test("une carte filtrée sur /projets garde sa largeur de colonne à 1 920 px", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    // « Infrastructure » ne laisse qu'un seul dossier (UGB Link, cf. tests/e2e/projets.spec.ts).
    await page.goto("/projets?categorie=infrastructure");
    const grille = page.locator(".pa-grid-projets");
    await expect(page.getByTestId("project-card")).toHaveCount(1);
    const largeurGrille = await grille.evaluate((el) => el.getBoundingClientRect().width);
    const largeurCarte = await page
      .getByTestId("project-card")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(largeurCarte).toBeLessThanOrEqual(largeurGrille / 4 + 2);
  });

  test("le haut de l'accueil passe sur une colonne sous 1 024 px", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto("/");
    expect(await colonnes(page, ".pa-herogrid")).toBe(1);
  });

  test("le cartouche grandit sur grand écran", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const largeur = await page.locator(".pa-frame--accueil").evaluate((el) => el.getBoundingClientRect().width);
    expect(largeur).toBeGreaterThanOrEqual(320);
  });

  test("le schéma de la carte vedette est agrandi et aligné avec sa légende à partir de 1 440 px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const schema = page.locator(".pa-schema-simple").first();
    const legende = page.locator(".pa-feature-fig figcaption").first();
    const [largeurSchema, bordSchema, bordLegende] = await Promise.all([
      schema.evaluate((el) => el.getBoundingClientRect().width),
      schema.evaluate((el) => el.getBoundingClientRect().left),
      legende.evaluate((el) => el.getBoundingClientRect().left),
    ]);
    expect(largeurSchema).toBeGreaterThan(560);
    expect(Math.abs(bordSchema - bordLegende)).toBeLessThanOrEqual(1);
  });

  test("la grille Stack (.pa-techs) est bornée à quatre colonnes sur grand écran", async ({ page }) => {
    for (const largeur of [1920, 2560]) {
      await page.setViewportSize({ width: largeur, height: 1080 });
      await page.goto("/a-propos");
      expect(await colonnes(page, ".pa-techs")).toBeLessThanOrEqual(4);
    }
  });

  test("les mini-schémas des cartes de projet restent lisibles (texte d'au moins 11 px)", async ({ page }) => {
    for (const largeur of [320, 1024, 1920]) {
      await page.setViewportSize({ width: largeur, height: 1000 });
      await page.goto("/projets");
      await expect(page.getByTestId("compteur")).toBeVisible();
      const svgs = await page.locator(".pa-card-fig svg").all();
      expect(svgs.length).toBeGreaterThan(0);
      for (const svg of svgs) {
        const tailles = await taillesRendues(svg);
        expect(Math.min(...tailles), `${largeur}px`).toBeGreaterThanOrEqual(11);
      }
    }
  });

  test("les mini-schémas des cartes de projet ont une marge intérieure et une échelle communes", async ({
    page,
  }) => {
    for (const largeur of [320, 1024, 1920]) {
      await page.setViewportSize({ width: largeur, height: 1000 });
      await page.goto("/projets");
      await expect(page.getByTestId("compteur")).toBeVisible();
      const svgs = await page.locator(".pa-card-fig svg").all();
      expect(svgs.length).toBeGreaterThan(0);

      const hauteurs: number[] = [];
      for (const svg of svgs) {
        // Taille : chaque texte rend au moins 11 px (même garde que le test précédent).
        const tailles = await taillesRendues(svg);
        expect(Math.min(...tailles), `${largeur}px`).toBeGreaterThanOrEqual(11);

        // Marge intérieure : chaque texte tient dans son rectangle (même <g> — seuls les groupes
        // de boîte ont les deux ; les groupes de flèches n'ont ni l'un ni l'autre) avec au moins
        // 6 px rendus de marge de chaque côté.
        const marges = await svg.evaluate((el) => {
          return Array.from(el.querySelectorAll("g"))
            .map((g) => {
              const rect = g.querySelector("rect");
              const texte = g.querySelector("text");
              if (!rect || !texte) return null;
              const r = rect.getBoundingClientRect();
              const t = texte.getBoundingClientRect();
              return {
                gauche: t.left - r.left,
                droite: r.right - t.right,
                haut: t.top - r.top,
                bas: r.bottom - t.bottom,
              };
            })
            .filter((m): m is NonNullable<typeof m> => m !== null);
        });
        expect(marges.length, `${largeur}px`).toBe(3);
        for (const marge of marges) {
          expect(marge.gauche, `${largeur}px gauche`).toBeGreaterThanOrEqual(6);
          expect(marge.droite, `${largeur}px droite`).toBeGreaterThanOrEqual(6);
          expect(marge.haut, `${largeur}px haut`).toBeGreaterThanOrEqual(6);
          expect(marge.bas, `${largeur}px bas`).toBeGreaterThanOrEqual(6);
        }

        hauteurs.push(await svg.evaluate((el) => el.getBoundingClientRect().height));
      }

      // Échelle : même viewBox pour tous les schémas de la page, donc même hauteur rendue.
      expect(Math.max(...hauteurs) - Math.min(...hauteurs), `${largeur}px`).toBeLessThanOrEqual(2);
    }
  });

  test("le bandeau Présentation s'aligne sur la grille de contenu", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto("/");
    const [bandeau, contenu] = await Promise.all([
      page.locator(".pa-intro > :first-child").evaluate((el) => el.getBoundingClientRect().left),
      page.locator("main .pa-wrap").first().evaluate((el) => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft)),
    ]);
    expect(Math.abs(bandeau - contenu)).toBeLessThanOrEqual(1);
  });

  test("le texte des faits pairs de la première vue mobile ne touche pas le trait de séparation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/");
    const fait2 = page.locator(".pa-facts--hero .pa-fact").nth(1);
    const [bordFait, bordTexte] = await Promise.all([
      fait2.evaluate((el) => el.getBoundingClientRect().left),
      fait2.locator("dd").evaluate((el) => el.getBoundingClientRect().left),
    ]);
    expect(bordTexte - bordFait).toBeGreaterThanOrEqual(8);
  });

  test("les paragraphes ne dépassent pas 68 caractères par ligne sur grand écran", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    // /projets/ugb-link et /a-propos portent du texte courant réel qui n'apparaît pas comme un
    // simple ".pa-casebody > p" ou ".pa-prose > p" dans le DOM (cf. mise-en-page.css) :
    // - /projets/ugb-link : le paragraphe de <Contexte> (.pa-context-texte > p,
    //   components/mdx.tsx), les réponses des fiches de décision (.pa-adr dd,
    //   components/DecisionRecord.tsx) et le texte d'exploitation (.pa-ops p).
    // - /a-propos : le détail de chaque étape de la frise (.pa-what p,
    //   app/a-propos/page.tsx).
    // /projets/gamecupsn couvre en plus ".pa-prose > p" (composant <Prose>).
    for (const chemin of ["/projets/ugb-link", "/a-propos", "/projets/gamecupsn"]) {
      await page.goto(chemin);
      const { nbMesures, depasse } = await page.evaluate(() => {
        const ch = (el: Element) => {
          const sonde = document.createElement("span");
          sonde.textContent = "0";
          sonde.style.cssText = "position:absolute;visibility:hidden;font:inherit";
          el.appendChild(sonde);
          const l = sonde.getBoundingClientRect().width;
          sonde.remove();
          return l;
        };
        const paragraphes = Array.from(
          document.querySelectorAll(
            ".pa-casebody > p, .pa-prose > p, .pa-context-texte > p, .pa-ops p, .pa-adr dd, .pa-what p",
          ),
        );
        return {
          nbMesures: paragraphes.length,
          depasse: paragraphes
            .filter((p) => p.getBoundingClientRect().width > 68 * ch(p) + 2)
            .map((p) => (p.textContent ?? "").slice(0, 40)),
        };
      });
      // Garde-fou : un sélecteur qui ne trouve aucun élément ferait passer le test à vide.
      expect(nbMesures, `${chemin} : au moins un élément mesuré`).toBeGreaterThan(0);
      expect(depasse, chemin).toEqual([]);
    }
  });

  test("l'en-tête n'est plus collant sur un écran de faible hauteur", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 450 });
    await page.goto("/");
    const position = await page.locator(".pa-nav").evaluate((el) => getComputedStyle(el).position);
    // On ne fige pas la valeur exacte ("relative") ici : seul le retrait du collant est un
    // comportement observable à garantir. L'alignement du panneau du menu mobile, qui dépend
    // de ce choix précis, est vérifié explicitement par le test suivant.
    expect(position).not.toBe("sticky");
  });

  test("sur un téléphone à l'horizontale, le panneau du menu mobile touche le bas de l'en-tête", async ({
    page,
  }) => {
    // 667 × 375 : sous 768 px de large (menu mobile actif, styles/ajouts.css) ET sous 500 px
    // de haut (en-tête non collant, test précédent). Vérifie que le panneau reste collé au
    // bas de l'en-tête une fois .pa-nav passé en "relative".
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const panneau = page.locator(".pa-menu-panel");
    await expect(panneau).toBeVisible();
    const [hautPanneau, basEntete] = await Promise.all([
      panneau.evaluate((el) => el.getBoundingClientRect().top),
      page.locator(".pa-nav").evaluate((el) => el.getBoundingClientRect().bottom),
    ]);
    expect(Math.abs(hautPanneau - basEntete)).toBeLessThanOrEqual(2);
  });
});

test.describe("première vue mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "projet mobile uniquement");

  test("nom, titre, action principale et faits sont visibles sans défiler", async ({ page }) => {
    // .pa-rise (styles/plan.css, sous @media (prefers-reduced-motion: no-preference)) anime une
    // translateY(14px) pendant 0,7 s au chargement : sans neutralisation, une mesure prise juste
    // après goto() peut tomber en pleine animation et décaler la boîte englobante de quelques
    // pixels, avec un faux échec possible près de la limite des 812 px. `reduce` désactive la
    // règle d'animation elle-même (elle ne matche plus la media query), pas seulement sa durée.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hauteur = 812;
    for (const cible of [
      page.getByTestId("surtitre-identite"),
      page.locator("h1.pa-hero"),
      page.getByTestId("action-principale"),
      page.getByTestId("faits-hero"),
    ]) {
      const boite = await cible.boundingBox();
      expect(boite, "élément présent").not.toBeNull();
      expect(boite!.y + boite!.height).toBeLessThanOrEqual(hauteur);
    }
  });
});

test("chaque fait n'est exposé qu'une fois, quelle que soit la largeur", async ({ page }) => {
  // Les variantes « compacte » (hero) et « bandeau » de FactStrip rendent toutes deux la liste
  // complète de site.faits dans le DOM ; seule la CSS (display: none) en masque une par largeur
  // d'écran — d'où l'intérêt de vérifier ici TOUS les faits, sur les deux projets (bureau et
  // mobile), plutôt qu'un seul fait sur un seul projet.
  await page.goto("/");
  for (const fait of site.faits) {
    await expect(page.getByRole("definition").filter({ hasText: fait.libelle })).toHaveCount(1);
  }
});

test.describe("schéma complet de l'étude de cas", () => {
  test("sur mobile, il défile dans son cadre, avec un indice, et reçoit le focus", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile uniquement");
    await page.goto("/projets/ugb-link#architecture");
    const cadre = page.getByTestId("schema-defilant");
    await expect(cadre).toHaveAttribute("tabindex", "0");
    await expect(cadre).toHaveAttribute("role", "region");
    await expect(cadre).toHaveAttribute("data-deborde", "true");
    await expect(page.getByTestId("indice-defilement")).toBeVisible();
    // Libellés principaux des blocs (.d-t, 14 unités) : au moins 11 px rendus.
    const tailles = await taillesRendues(cadre.locator("svg").first(), ".d-t");
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
  });

  test("sur ordinateur, il tient dans la page et n'est pas focalisable", async ({ page, isMobile }) => {
    test.skip(isMobile, "bureau uniquement");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projets/ugb-link#architecture");
    const cadre = page.getByTestId("schema-defilant");
    await expect(cadre).toHaveAttribute("data-deborde", "false");
    await expect(cadre).not.toHaveAttribute("tabindex", "0");
    await expect(page.getByTestId("indice-defilement")).toBeHidden();
  });

  test.describe("lisible aussi en tablette et sur petit ordinateur", () => {
    test.skip(({ isMobile }) => isMobile, "largeurs pilotées explicitement : projet bureau seulement");

    for (const largeur of [768, 1024, 1440]) {
      test(`les libellés restent lisibles et le débordement suit la largeur réelle du cadre, à ${largeur}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: largeur, height: 900 });
        await page.goto("/projets/ugb-link#architecture");
        const cadre = page.getByTestId("schema-defilant");
        // Le cadre garde une largeur minimale lisible (min-width sur le SVG, inconditionnel) et
        // défile dans son cadre dès que la colonne qui le contient est plus étroite que cette
        // largeur minimale ; au-delà, il tient sans défiler. On mesure la largeur réelle du
        // cadre plutôt que de la déduire de la largeur de viewport, pour ne pas dupliquer le
        // calcul de la mise en page (gouttière, colonne latérale…) dans le test.
        const largeurCadre = await cadre.evaluate((el) => el.clientWidth);
        await expect(cadre).toHaveAttribute("data-deborde", largeurCadre < 800 ? "true" : "false");
        const tailles = await taillesRendues(cadre.locator("svg").first(), ".d-t");
        expect(Math.min(...tailles)).toBeGreaterThanOrEqual(11);
      });
    }
  });
});
