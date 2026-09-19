import type { IconKey } from "@/lib/icons";

export type CleDomaine = "backend" | "systemes" | "infra";
export type Outil = { libelle: string; icone?: IconKey };
export type Domaine = { cle: CleDomaine; titre: string; phrase: string; fais: string[]; outils: Outil[] };
export type Recommandation = { citation: string; nom: string; fonction: string; photo?: string };

export const site = {
  nom: "Abdou Aziz Sy",
  initiales: "AAS",
  signature: "A. A. SY",
  metier: "Ingénieur logiciel",
  ville: "Dakar, Sénégal",
  villeCourte: "DAKAR, SN",
  email: "abdouazizsy@esp.sn",
  liens: {
    linkedin: undefined as string | undefined,
    github: "https://github.com/Abdou-Aziz-Sy" as string | undefined,
  },
  diplome: "Diplômé ESP 2026",
  disponibilite: "Disponible pour un poste",
  disponibiliteDetail: "Disponible pour un poste · Dakar ou à distance",
  cv: { href: "/cv.pdf", fichier: "CV_Abdou_Aziz_SY.pdf" },
  /** Chemin du portrait dans public/, à renseigner quand le fichier est fourni. */
  portrait: undefined as string | undefined,
  description:
    "Ingénieur logiciel à Dakar, orienté backend, conception de systèmes et infrastructure.",

  faits: [
    { valeur: "8", libelle: "processus administratifs en production" },
    { valeur: "13", libelle: "domaines d'API couverts par des tests bout en bout" },
    { valeur: "2", libelle: "sites reliés" },
    { valeur: "260", unite: "km", libelle: "entre Dakar et Saint-Louis" },
  ] as { valeur: string; unite?: string; libelle: string }[],

  domaines: [
    {
      cle: "backend",
      titre: "Backend",
      phrase: "Des API fiables, des données bien modélisées.",
      fais: [
        "API REST",
        "Authentification et contrôle d'accès",
        "Modélisation et migrations",
        "Traitements asynchrones",
      ],
      outils: [
        { libelle: "Node.js", icone: "nodedotjs" },
        { libelle: "Express", icone: "express" },
        { libelle: "TypeScript", icone: "typescript" },
        { libelle: "PostgreSQL", icone: "postgresql" },
        { libelle: "Redis", icone: "redis" },
      ],
    },
    {
      cle: "systemes",
      titre: "Conception de systèmes",
      phrase: "Réfléchir avant de coder, et écrire pourquoi.",
      fais: [
        "Découpage en services",
        "Choix techniques argumentés",
        "Fiches de décision",
        "Intégration de modèles d'IA",
      ],
      outils: [
        { libelle: "Schémas d'architecture" },
        { libelle: "ADR" },
        { libelle: "Ollama", icone: "ollama" },
        { libelle: "OCR" },
      ],
    },
    {
      cle: "infra",
      titre: "Infrastructure & exploitation",
      phrase: "Livrer, surveiller, restaurer.",
      fais: [
        "Conteneurisation",
        "Déploiement continu",
        "Durcissement de serveurs",
        "Sauvegardes et exercices de restauration",
      ],
      outils: [
        { libelle: "Docker", icone: "docker" },
        { libelle: "GitHub Actions", icone: "githubactions" },
        { libelle: "Nginx", icone: "nginx" },
        { libelle: "Linux", icone: "linux" },
      ],
    },
  ] as Domaine[],

  interface: "React, Next.js.",

  parcours: [
    { periode: "2021 — 2023", titre: "Diplôme Supérieur de Technologie" },
    { periode: "2023 — 2024", titre: "Licence 3" },
    {
      periode: "2024 — 2026",
      titre: "Master Génie Logiciel",
      detail: "École Supérieure Polytechnique (ESP/UCAD)",
    },
    {
      periode: "fév. 2026 →",
      titre: "Alternance — Antenne UGB, Dakar",
      detail: "Ingénieur logiciel · UGB Link, en production",
      actuel: true,
    },
  ] as { periode: string; titre: string; detail?: string; actuel?: boolean }[],

  stack: [
    { icone: "nodedotjs", nom: "Node.js", role: "Runtime" },
    { icone: "typescript", nom: "TypeScript", role: "Langage" },
    { icone: "postgresql", nom: "PostgreSQL", role: "Données" },
    { icone: "docker", nom: "Docker", role: "Conteneurs" },
    { icone: "githubactions", nom: "CI/CD", role: "GitHub Actions" },
    { icone: "react", nom: "React", role: "Interface" },
    { icone: "nextdotjs", nom: "Next.js", role: "Interface" },
    { icone: "ollama", nom: "IA appliquée", role: "Modèles locaux" },
  ] as { icone: IconKey; nom: string; role: string }[],

  /** Recommandations réelles uniquement : la section reste masquée tant que la liste est vide. */
  recommandations: [] as Recommandation[],
};
