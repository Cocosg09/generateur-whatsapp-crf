import { test } from "node:test";
import assert from "node:assert/strict";
import {
  trouverRole,
  extraireHeures,
  extraireDuTableauTexte,
  construireMessage,
  parserMessage,
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
