import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trouverRole,
  extraireHeures,
  extraireDuTableauTexte,
  construireMessage,
  parserMessage,
  formaterPlageHoraire,
  extraireOrdreMission,
  nouveauPoste,
  serialiserPostes,
  restaurerPostes,
  calculerHeureRdv,
} from "./dps.js";

test("trouverRole reconnaît un rôle courant indépendamment de la casse", () => {
  assert.equal(trouverRole("secouriste"), "Secouriste");
  assert.equal(trouverRole("  Chef de poste  "), "Chef de poste");
});

test("trouverRole retombe sur PSE si le rôle est inconnu", () => {
  assert.equal(trouverRole("Bénévole logistique"), "PSE");
});

test("extraireHeures extrait une plage horaire HH:MM...HH:MM", () => {
  assert.equal(extraireHeures("de 12:00 à 19:30"), "12H - 19H");
});

test("extraireHeures renvoie une chaîne vide si aucune heure trouvée", () => {
  assert.equal(extraireHeures("pas d'horaire ici"), "");
});

test("extraireDuTableauTexte extrait poste, horaires et intervenants", () => {
  const texte = [
    "14 Juillet - PAPS",
    "Qualifications\tIntervenants\tHoraires",
    "PSE",
    "Jean Dupont",
    "de 12:00 à 19:00",
    "Chef de poste",
    "Marie Martin",
    "de 12:00 à 19:00",
  ].join("\n");

  const resultat = extraireDuTableauTexte(texte);
  assert.equal(resultat.poste, "14 Juillet - PAPS");
  assert.equal(resultat.horaires, "12H - 19H");
  assert.deepEqual(resultat.intervenants, [
    { role: "PSE", nom: "Jean Dupont", conducteur: false, typeVehicule: "VL" },
    { role: "Chef de poste", nom: "Marie Martin", conducteur: false, typeVehicule: "VL" },
  ]);
});

test("construireMessage puis parserMessage font un aller-retour fidèle", () => {
  const postes = [
    {
      poste: "14 Juillet - PAPS",
      horaires: "12H - 19H",
      heureRdv: "11h30",
      lieuRdv: "Nouveau PÔLE",
      lieuPoste: "Place du village",
      contacts: "Jean (0600000000)",
      vehicule: "RIFTER",
      materiel: "Lot O2\nDSA",
      intervenants: [
        { role: "PSE", nom: "Jean Dupont", conducteur: false, typeVehicule: "VL" },
        { role: "Chef de poste", nom: "Marie Martin", conducteur: true, typeVehicule: "VPSP" },
      ],
    },
  ];

  const message = construireMessage(postes);
  const reparsed = parserMessage(message);

  assert.equal(reparsed.length, 1);
  assert.equal(reparsed[0].poste, "14 Juillet - PAPS");
  assert.equal(reparsed[0].horaires, "12H - 19H");
  assert.equal(reparsed[0].heureRdv, "11h30");
  assert.equal(reparsed[0].lieuRdv, "Nouveau PÔLE");
  assert.equal(reparsed[0].lieuPoste, "Place du village");
  assert.equal(reparsed[0].contacts, "Jean (0600000000)");
  assert.equal(reparsed[0].vehicule, "RIFTER");
  assert.equal(reparsed[0].materiel, "Lot O2\nDSA");
  assert.deepEqual(reparsed[0].intervenants, [
    { role: "PSE", nom: "Jean Dupont", conducteur: false, typeVehicule: "VL" },
    { role: "Chef de poste", nom: "Marie Martin", conducteur: true, typeVehicule: "VPSP" },
  ]);
});

test("construireMessage n'affiche pas les champs non renseignés", () => {
  const postes = [
    {
      poste: "14 Juillet - PAPS",
      horaires: "12H - 19H",
      heureRdv: "",
      lieuRdv: "",
      lieuPoste: "",
      contacts: "Jean (0600000000)",
      vehicule: "",
      materiel: "",
      intervenants: [{ role: "PSE", nom: "Jean Dupont", conducteur: false, typeVehicule: "VL" }],
    },
  ];

  const message = construireMessage(postes);

  assert.ok(!message.includes("📍 RDV"));
  assert.ok(!message.includes("Lieux du poste:"));
  assert.ok(!message.includes("Véhicule:"));
  assert.ok(!message.includes("🎒 Matériel"));
  assert.ok(message.includes("Contact sur place : Jean (0600000000)"));
  assert.ok(message.includes("• PSE : Jean Dupont"));
  assert.ok(!message.includes("  \n"), "aucune ligne ne doit rester avec un champ vide");
});

test("construireMessage n'affiche qu'une partie du RDV si seul un des deux champs est renseigné", () => {
  const posteBase = {
    poste: "A",
    horaires: "8H - 12H",
    lieuPoste: "",
    contacts: "",
    vehicule: "",
    materiel: "",
    intervenants: [{ role: "PSE", nom: "X", conducteur: false, typeVehicule: "VL" }],
  };

  const messageHeureSeule = construireMessage([{ ...posteBase, heureRdv: "11h30", lieuRdv: "" }]);
  assert.ok(messageHeureSeule.includes("📍 RDV à 11h30"));
  assert.ok(!messageHeureSeule.includes("📍 RDV à 11h30 au"));

  const messageLieuSeul = construireMessage([{ ...posteBase, heureRdv: "", lieuRdv: "Nouveau PÔLE" }]);
  assert.ok(messageLieuSeul.includes("📍 RDV au Nouveau PÔLE"));
});

test("construireMessage puis parserMessage restent cohérents quand des champs sont omis", () => {
  // Nom de poste sans tiret : quand les horaires sont vides, la ligne
  // d'en-tête n'a pas de suffixe " - ..." pour les distinguer d'un tiret
  // dans le nom du poste (limitation connue du parsing par regex).
  const postes = [
    {
      poste: "14 Juillet",
      horaires: "",
      heureRdv: "",
      lieuRdv: "Nouveau PÔLE",
      lieuPoste: "",
      contacts: "",
      vehicule: "",
      materiel: "",
      intervenants: [{ role: "PSE", nom: "Jean Dupont", conducteur: false, typeVehicule: "VL" }],
    },
  ];

  const reparsed = parserMessage(construireMessage(postes));

  assert.equal(reparsed[0].poste, "14 Juillet");
  assert.equal(reparsed[0].horaires, "");
  assert.equal(reparsed[0].heureRdv, "");
  assert.equal(reparsed[0].lieuRdv, "Nouveau PÔLE");
});

test("formaterPlageHoraire n'affiche les minutes que si non nulles", () => {
  assert.equal(formaterPlageHoraire("14:00", "23:00"), "14H - 23H");
  assert.equal(formaterPlageHoraire("14:30", "23:00"), "14H30 - 23H");
});

// Coordonnées (str + x/y) capturées via pdfjs `page.getTextContent()` sur un
// vrai ordre de mission Croix-Rouge (1 affectation, 2 intervenants). Le
// tableau y est un vrai tableau positionnel : les items d'une même ligne de
// tableau se répartissent sur plusieurs ordonnées (cellules multi-lignes) et
// partagent leur y avec les colonnes voisines, pas avec le reste de "leur"
// cellule — d'où l'extraction par position plutôt que par ordre de lecture.
const ITEMS_ORDRE_MISSION_MIREPOIX = [
  { texte: "Objet de la mission : Fêtes historiques de Mirepoix", x: 33.6, y: 579.54 },
  { texte: "Horaires de début et fin de mission/DPS :", x: 33.6, y: 529.34 },
  { texte: "17/07/2026 14:00", x: 257.85, y: 529.34 },
  { texte: "17/07/2026 23:00", x: 257.85, y: 515.84 },
  { texte: "Lieu d’exécution :", x: 33.6, y: 491.09 },
  { texte: "PLACE DU MARECHAL LECLERC, 09500 MIREPOIX", x: 257.85, y: 491.09 },
  { texte: "Contact sur place :", x: 33.6, y: 466.34 },
  { texte: "sybille delbosc - +33600000000", x: 257.85, y: 466.34 },
  { texte: "PERSONNES ENGAGÉES", x: 42.6, y: 382.86 },
  { texte: "Affectation", x: 41.23, y: 347.79 },
  { texte: "Horaires", x: 138.19, y: 357.28 },
  { texte: "d’affectation", x: 125.34, y: 338.3 },
  { texte: "NOM Prénom NIVOL", x: 211.74, y: 347.79 },
  { texte: "Qualification -", x: 337.52, y: 357.28 },
  { texte: "Rôle", x: 366.51, y: 338.3 },
  { texte: "Structure", x: 474.93, y: 347.79 },
  { texte: "PAPS - Binôme", x: 43.83, y: 310.63 },
  { texte: "17/07/2026 14:00 -", x: 126.62, y: 317.53 },
  { texte: "17/07/2026 23:00", x: 129.03, y: 303.73 },
  { texte: "VIDAL Monique", x: 237.2, y: 317.53 },
  { texte: "(00001302465W)", x: 232.9, y: 303.73 },
  { texte: "Équipier secouriste", x: 340.99, y: 310.63 },
  { texte: "UNITE LOCALE DE PAMIERS PORTE", x: 438.98, y: 317.53 },
  { texte: "D'ARIEGE", x: 484.82, y: 303.73 },
  { texte: "PAPS - Binôme", x: 43.83, y: 277.78 },
  { texte: "17/07/2026 14:00 -", x: 126.62, y: 284.68 },
  { texte: "17/07/2026 23:00", x: 129.03, y: 270.88 },
  { texte: "LEBON SLOANE", x: 238.46, y: 284.68 },
  { texte: "(01100167321A)", x: 238.13, y: 270.88 },
  { texte: "Secouriste", x: 357.74, y: 277.78 },
  { texte: "UNITE LOCALE DE PAMIERS PORTE", x: 438.98, y: 284.68 },
  { texte: "D'ARIEGE", x: 484.82, y: 270.88 },
  { texte: "MODALITES OPERATIONNELLES", x: 42.6, y: 235.88 },
];

test("extraireOrdreMission extrait les postes d'un ordre de mission Croix-Rouge", () => {
  const postes = extraireOrdreMission(ITEMS_ORDRE_MISSION_MIREPOIX);

  assert.equal(postes.length, 1);
  assert.equal(postes[0].poste, "Fêtes historiques de Mirepoix - PAPS - Binôme");
  assert.equal(postes[0].horaires, "14H - 23H");
  assert.equal(postes[0].lieuPoste, "PLACE DU MARECHAL LECLERC, 09500 MIREPOIX");
  assert.equal(postes[0].contacts, "sybille delbosc - +33600000000");
  assert.deepEqual(postes[0].intervenants, [
    { role: "Équipier secouriste", nom: "VIDAL Monique", conducteur: false, typeVehicule: "VL" },
    { role: "Secouriste", nom: "LEBON SLOANE", conducteur: false, typeVehicule: "VL" },
  ]);
});

test("extraireOrdreMission regroupe les intervenants par affectation quand plusieurs postes existent", () => {
  const items = [
    { texte: "Objet de la mission : Trail nocturne", x: 33.6, y: 579.54 },
    { texte: "Horaires de début et fin de mission/DPS :", x: 33.6, y: 529.34 },
    { texte: "17/07/2026 08:00", x: 257.85, y: 529.34 },
    { texte: "17/07/2026 20:00", x: 257.85, y: 515.84 },
    { texte: "Lieu d’exécution :", x: 33.6, y: 491.09 },
    { texte: "Stade municipal", x: 257.85, y: 491.09 },
    { texte: "Contact sur place :", x: 33.6, y: 466.34 },
    { texte: "Jean (0600000000)", x: 257.85, y: 466.34 },
    { texte: "PERSONNES ENGAGÉES", x: 42.6, y: 382.86 },
    { texte: "Affectation", x: 41.23, y: 347.79 },
    { texte: "Horaires", x: 138.19, y: 357.28 },
    { texte: "d’affectation", x: 125.34, y: 338.3 },
    { texte: "NOM Prénom NIVOL", x: 211.74, y: 347.79 },
    { texte: "Qualification -", x: 337.52, y: 357.28 },
    { texte: "Rôle", x: 366.51, y: 338.3 },
    { texte: "Structure", x: 474.93, y: 347.79 },
    // Ligne 1 : affectation "PAPS - Binôme"
    { texte: "PAPS - Binôme", x: 43.83, y: 310.63 },
    { texte: "17/07/2026 08:00 -", x: 126.62, y: 317.53 },
    { texte: "17/07/2026 20:00", x: 129.03, y: 303.73 },
    { texte: "A B", x: 237.2, y: 317.53 },
    { texte: "(1)", x: 232.9, y: 303.73 },
    { texte: "PSE", x: 340.99, y: 310.63 },
    // Ligne 2 : affectation différente "Poste fixe"
    { texte: "Poste fixe", x: 43.83, y: 277.78 },
    { texte: "17/07/2026 08:00 -", x: 126.62, y: 284.68 },
    { texte: "17/07/2026 20:00", x: 129.03, y: 270.88 },
    { texte: "C D", x: 237.2, y: 284.68 },
    { texte: "(2)", x: 232.9, y: 270.88 },
    { texte: "Chef de poste", x: 340.99, y: 277.78 },
    { texte: "MODALITES OPERATIONNELLES", x: 42.6, y: 235.88 },
  ];

  const postes = extraireOrdreMission(items);

  assert.equal(postes.length, 2);
  assert.equal(postes[0].poste, "Trail nocturne - PAPS - Binôme");
  assert.deepEqual(postes[0].intervenants, [
    { role: "PSE", nom: "A B", conducteur: false, typeVehicule: "VL" },
  ]);
  assert.equal(postes[1].poste, "Trail nocturne - Poste fixe");
  assert.deepEqual(postes[1].intervenants, [
    { role: "Chef de poste", nom: "C D", conducteur: false, typeVehicule: "VL" },
  ]);
});

test("extraireOrdreMission renvoie un poste avec les champs d'en-tête si le tableau n'est pas détecté", () => {
  const items = [
    { texte: "Objet de la mission : Trail nocturne", x: 33.6, y: 579.54 },
    { texte: "Lieu d’exécution :", x: 33.6, y: 491.09 },
    { texte: "Stade municipal", x: 257.85, y: 491.09 },
  ];

  const postes = extraireOrdreMission(items);

  assert.equal(postes.length, 1);
  assert.equal(postes[0].poste, "Trail nocturne");
  assert.equal(postes[0].lieuPoste, "Stade municipal");
  assert.deepEqual(postes[0].intervenants, []);
});

test("extraireOrdreMission renvoie une liste vide si aucune information n'est reconnue", () => {
  assert.deepEqual(extraireOrdreMission([{ texte: "Bonjour", x: 0, y: 0 }]), []);
});

test("construireMessage gère plusieurs postes séparés par ---", () => {
  const postes = [
    {
      poste: "A",
      horaires: "8H - 12H",
      heureRdv: "",
      lieuRdv: "",
      lieuPoste: "",
      contacts: "",
      vehicule: "",
      materiel: "",
      intervenants: [{ role: "PSE", nom: "X", conducteur: false, typeVehicule: "VL" }],
    },
    {
      poste: "B",
      horaires: "12H - 18H",
      heureRdv: "",
      lieuRdv: "",
      lieuPoste: "",
      contacts: "",
      vehicule: "",
      materiel: "",
      intervenants: [{ role: "PSE", nom: "Y", conducteur: false, typeVehicule: "VL" }],
    },
  ];

  const reparsed = parserMessage(construireMessage(postes));
  assert.equal(reparsed.length, 2);
  assert.equal(reparsed[0].poste, "A");
  assert.equal(reparsed[1].poste, "B");
});

test("serialiserPostes puis restaurerPostes font un aller-retour fidèle", () => {
  const original = {
    ...nouveauPoste(),
    poste: "14 Juillet - PAPS",
    horaires: "12H - 19H",
    heureRdv: "11h30",
    lieuRdv: "Nouveau PÔLE",
    lieuPoste: "Place du village",
    contacts: "Jean (0600000000)",
    vehicule: "RIFTER",
    materiel: "Lot A\nOxygène",
    texteCollé: "contenu collé à ne pas stocker",
    intervenants: [
      { role: "Chef de poste", nom: "Marie Martin", conducteur: true, typeVehicule: "VPSP" },
    ],
  };

  const serialises = serialiserPostes([original]);
  assert.equal(serialises[0].id, undefined);
  assert.equal(serialises[0].texteCollé, undefined);

  const restaures = restaurerPostes(serialises);
  assert.equal(restaures.length, 1);
  assert.equal(typeof restaures[0].id, "string");
  assert.equal(restaures[0].texteCollé, "");
  assert.equal(restaures[0].poste, original.poste);
  assert.equal(restaures[0].materiel, original.materiel);
  assert.deepEqual(restaures[0].intervenants, original.intervenants);
});

test("restaurerPostes refuse les structures inexploitables", () => {
  assert.equal(restaurerPostes(undefined), null);
  assert.equal(restaurerPostes("pas un tableau"), null);
  assert.equal(restaurerPostes([]), null);
  assert.equal(restaurerPostes([null]), null);
  assert.equal(restaurerPostes(["texte"]), null);
  assert.equal(restaurerPostes([["tableau imbriqué"]]), null);
});

test("restaurerPostes assainit les champs inattendus ou manquants", () => {
  const restaures = restaurerPostes([
    {
      poste: "PAPS",
      horaires: 42,
      champInconnu: "ignoré",
      intervenants: [
        { role: "Rôle inconnu", nom: "Jean", conducteur: 1, typeVehicule: "Camion" },
        { nom: 12 },
        "pas un objet",
      ],
    },
  ]);

  assert.equal(restaures.length, 1);
  assert.equal(restaures[0].poste, "PAPS");
  assert.equal(restaures[0].horaires, "");
  assert.equal(restaures[0].champInconnu, undefined);
  assert.deepEqual(restaures[0].intervenants, [
    { role: "PSE", nom: "Jean", conducteur: true, typeVehicule: "VL" },
  ]);
});

test("calculerHeureRdv retranche l'avance par défaut (30 min) au début des horaires", () => {
  assert.equal(calculerHeureRdv("12H - 19H"), "11h30");
  assert.equal(calculerHeureRdv("14h30 - 23h00"), "14h00");
});

test("calculerHeureRdv accepte une avance personnalisée", () => {
  assert.equal(calculerHeureRdv("10H - 20H", 60), "09h00");
});

test("calculerHeureRdv passe minuit si l'avance dépasse le début", () => {
  assert.equal(calculerHeureRdv("00H10", 30), "23h40");
});

test("calculerHeureRdv renvoie une chaîne vide si aucun horaire n'est reconnaissable", () => {
  assert.equal(calculerHeureRdv("à préciser"), "");
});
