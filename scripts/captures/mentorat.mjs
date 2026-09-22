// Captures annotées de la plateforme de mentorat (étude de cas `mentorat-vcn`).
//
// Prérequis : l'application tourne en local sur une base de démonstration (procédure dans
// scripts/captures/README.md) — interface sur :3000, API sur :5050.
//   node scripts/captures/mentorat.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { annoter, effacerAnnotations } from "./annoter.mjs";

const FRONT = "http://localhost:3000";
const API = "http://localhost:5050";
const SORTIE = "public/projets/mentorat";
const VUE = { width: 1440, height: 900 };
mkdirSync(SORTIE, { recursive: true });

const navigateur = await chromium.launch({ channel: "msedge" });

async function session(email, role) {
  const page = await navigateur.newPage({ viewport: VUE });
  await page.goto(`${FRONT}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL(new RegExp(`/${role}`));
  return page;
}

/** `defilement` : position verticale de la vue ; `hauteur` : coupe l'image avant le pied de page. */
async function capturer(page, nom, annotations, { defilement = 0, hauteur = VUE.height } = {}) {
  await page.evaluate((y) => scrollTo(0, y), defilement);
  // Les animations d'entrée de l'application (AOS) doivent être terminées.
  await page.waitForTimeout(1500);
  await annoter(page, annotations);
  await page.screenshot({ path: `${SORTIE}/${nom}.png`, clip: { x: 0, y: 0, width: VUE.width, height: hauteur } });
  await effacerAnnotations(page);
  console.log(`${SORTIE}/${nom}.png`);
}

// Mentor : les deux façons de déclarer une disponibilité (décision 01).
const mentor = await session("abdou.sow@mentor.pro.sn", "mentor");
await mentor.goto(`${FRONT}/mentor/availabilities`);
await mentor.getByText("Mes disponibilités récurrentes").waitFor();
await capturer(mentor, "disponibilites-recurrentes", [
  { cible: mentor.getByText("Créneaux spécifiques", { exact: false }), texte: "Deux façons de déclarer", cote: "bas" },
  { cible: mentor.getByText("Mes disponibilités récurrentes"), texte: "Semaine type, déclarée une fois", cote: "droite" },
]);
await mentor.getByText("Créneaux spécifiques", { exact: false }).first().click();
await mentor.getByText("Mes créneaux spécifiques").waitFor();
await mentor.waitForTimeout(600);
await capturer(mentor, "creneaux-specifiques", [
  { cible: mentor.getByText("Revue de CV avant les candidatures"), texte: "Exception datée, avec son objet", cote: "droite" },
  { cible: mentor.locator('input[type="datetime-local"]').first(), texte: "Date précise, hors semaine type", cote: "haut" },
], { defilement: 220 });

// Étudiant : une conversation avec son mentor.
const etudiant = await session("abdou.sy@student.edu.sn", "student");
await etudiant.goto(`${FRONT}/student/studentmessages`);
await etudiant.getByText("Abdou Sow", { exact: true }).first().click();
await etudiant.getByText("revoir mon CV").first().waitFor();
await etudiant.waitForTimeout(600);
await capturer(etudiant, "messagerie", [
  // `last()` : la réponse apparaît aussi en aperçu dans la liste des conversations, avant la bulle.
  { cible: etudiant.getByText("jeudi 18 h").last(), texte: "Réponse du mentor", cote: "droite" },
  { cible: etudiant.getByPlaceholder("Écrivez votre message..."), texte: "Message ou pièce jointe", cote: "haut" },
]);

// Administrateur : vérification des mentors (contrainte C4) et campagnes.
const admin = await session("ibrahima.ba@admin.platform.sn", "admin");
await admin.goto(`${FRONT}/admin/mentor`);
await admin.getByText("Vérification des Mentors").waitFor();
await admin.waitForTimeout(800);
await capturer(admin, "verification-mentors", [
  { cible: admin.getByRole("columnheader", { name: "Vérifié" }), texte: "Visible des étudiants une fois vérifié", cote: "haut", marge: 4 },
], { hauteur: 700 });
await admin.goto(`${FRONT}/admin/campaigns`);
await admin.getByText("Séminaire Entrepreneuriat Jeunes").waitFor();
await admin.waitForTimeout(800);
await capturer(admin, "campagnes", [
  { cible: admin.getByText("10 / 30"), texte: "Inscrits / places", cote: "droite", marge: 4 },
  { cible: admin.getByRole("columnheader", { name: "Statut" }), texte: "Active ou archivée", cote: "gauche", marge: 4 },
], { hauteur: 600 });

// API : la documentation Swagger.
const doc = await navigateur.newPage({ viewport: VUE });
await doc.goto(`${API}/api-docs`);
await doc.locator(".opblock-tag").first().waitFor();
await doc.waitForTimeout(800);
await capturer(doc, "api-swagger", [
  { cible: doc.locator(".opblock-tag-section").first(), texte: "Routes groupées par domaine", cote: "haut" },
]);

await navigateur.close();
