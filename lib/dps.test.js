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

test("formaterPlageHoraire n'affiche les minutes que si non nulles", () => {
  assert.equal(formaterPlageHoraire("14:00", "23:00"), "14H - 23H");
  assert.equal(formaterPlageHoraire("14:30", "23:00"), "14H30 - 23H");
});

test("extraireOrdreMission extrait les postes d'un ordre de mission Croix-Rouge", () => {
  const texte = [
    "Objet de la mission : Fêtes historiques de Mirepoix",
    "Numéro d'agrément départemental : 20260090059",
    "Horaires de début et fin de mission/DPS : 17/07/2026 14:00",
    "17/07/2026 23:00",
    "Lieu d'exécution : PLACE DU MARECHAL LECLERC, 09500 MIREPOIX",
    "Contact sur place : sybille delbosc - +33600000000",
    "Responsable de la mission : Equipier secouriste: VIDAL Monique",
    "Affectation",
    "Horaires",
    "d'affectation",
    "NOM Prénom NIVOL",
    "Qualification -",
    "Rôle",
    "Structure",
    "PAPS - Binôme",
    "17/07/2026 14:00 -",
    "17/07/2026 23:00",
    "VIDAL Monique",
    "(00001302465W)",
    "Équipier secouriste",
    "UNITE LOCALE DE PAMIERS PORTE",
    "D'ARIEGE",
    "PAPS - Binôme",
    "17/07/2026 14:00 -",
    "17/07/2026 23:00",
    "LEBON SLOANE",
    "(01100167321A)",
    "Secouriste",
    "UNITE LOCALE DE PAMIERS PORTE",
    "D'ARIEGE",
    "MODALITES OPERATIONNELLES",
    "Horaire et lieu de RDV / Matériel engagé / Déroulement …",
  ].join("\n");

  const postes = extraireOrdreMission(texte);

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
  const texte = [
    "Objet de la mission : Trail nocturne",
    "Horaires de début et fin de mission/DPS : 17/07/2026 08:00",
    "17/07/2026 20:00",
    "Lieu d'exécution : Stade municipal",
    "Contact sur place : Jean (0600000000)",
    "Structure",
    "PAPS - Binôme",
    "08:00 -",
    "17/07/2026 20:00",
    "A B",
    "(1)",
    "PSE",
    "STRUCTURE A",
    "Poste fixe",
    "17/07/2026 08:00 -",
    "17/07/2026 20:00",
    "C D",
    "(2)",
    "Chef de poste",
    "STRUCTURE B",
    "MODALITES OPERATIONNELLES",
  ].join("\n");

  // La ligne "08:00 -" du premier bloc n'a pas le format date complet
  // attendu (cas volontairement dégradé) : elle n'est pas reconnue comme un
  // début de plage, seule l'affectation "Poste fixe" a une ligne de date
  // complète valide juste avant "C D".
  const postes = extraireOrdreMission(texte);

  assert.equal(postes.length, 1);
  assert.equal(postes[0].poste, "Trail nocturne - Poste fixe");
  assert.deepEqual(postes[0].intervenants, [
    { role: "Chef de poste", nom: "C D", conducteur: false, typeVehicule: "VL" },
  ]);
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
