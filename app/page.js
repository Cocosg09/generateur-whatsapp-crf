"use client";

import { useState } from "react";

const ROLES_COURANTS = [
  "PSE",
  "Secouriste",
  "Équipier secouriste",
  "Chef de poste",
  "Chef d'intervention",
  "Conducteur VL",
  "Conducteur VPSP",
];

export default function Home() {
  const [poste, setPoste] = useState("");
  const [horaires, setHoraires] = useState("");
  const [heureRdv, setHeureRdv] = useState("");
  const [lieuRdv, setLieuRdv] = useState("");
  const [lieuPoste, setLieuPoste] = useState("");
  const [contacts, setContacts] = useState("");
  const [intervenants, setIntervenants] = useState([{ role: "PSE", nom: "" }]);
  const [vehicule, setVehicule] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const [texteCollé, setTexteCollé] = useState("");

  function updateIntervenant(index, field, value) {
    const next = [...intervenants];
    next[index] = { ...next[index], [field]: value };
    setIntervenants(next);
  }

  function addIntervenant() {
    setIntervenants([...intervenants, { role: "PSE", nom: "" }]);
  }

  function removeIntervenant(index) {
    setIntervenants(intervenants.filter((_, i) => i !== index));
  }

  function extraireHeures(raw) {
    const match = raw.match(/(\d{2}):(\d{2}).*?(\d{2}):(\d{2})/);
    return match ? `${match[1]}H - ${match[3]}H` : "";
  }

  function trouverRole(texte) {
    const t = texte.trim().toLowerCase();
    const trouve = ROLES_COURANTS.find((r) => r.toLowerCase() === t);
    return trouve || ROLES_COURANTS[0];
  }

  function extraireDuTableau() {
    const lignes = texteCollé
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    const headerIdx = lignes.findIndex((l) =>
      l.toLowerCase().includes("qualifications")
    );
    const donnees = headerIdx !== -1 ? lignes.slice(headerIdx + 1) : lignes;

    const nouveauxIntervenants = [];
    let horairesTrouvés = "";

    for (let i = 0; i < donnees.length; i += 3) {
      const role = donnees[i];
      const nom = donnees[i + 1];
      const horairesRaw = donnees[i + 2];
      if (role && nom) {
        nouveauxIntervenants.push({ role: trouverRole(role), nom });
        if (!horairesTrouvés && horairesRaw) {
          horairesTrouvés = extraireHeures(horairesRaw);
        }
      }
    }

    if (nouveauxIntervenants.length > 0) {
      setIntervenants(nouveauxIntervenants);
    }
    if (horairesTrouvés) {
      setHoraires(horairesTrouvés);
    }
  }

  function genererMessage() {
    const listeIntervenants = intervenants
      .filter((i) => i.nom.trim() !== "")
      .map((i) => `•⁠  ⁠${i.role} : ${i.nom}`)
      .join("\n");

    const texte = `Poste ${poste} - ${horaires}

📍 RDV à ${heureRdv} au ${lieuRdv}
Lieux du poste: ${lieuPoste}
Contact sur place : ${contacts}

🚑
${listeIntervenants}

Véhicule: ${vehicule}

⚠️RAPPEL SUR LES VÉHICULES ⚠️
Merci de remplir les carnet de bord
Prêter une attention particulière à votre conduite
Prêter attention à l'état intérieur du véhicule
Et de faire le plein si besoin

Merci à tous et bon poste ! 👍
Dispo par message privé au besoin :)`;

    setMessage(texte);
    setCopied(false);
  }

  function copierMessage() {
    navigator.clipboard.writeText(message);
    setCopied(true);
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Générateur de message DPS</h1>

      <div className="space-y-2">
        <p className="font-semibold">
          Coller le tableau (qualifications/intervenants/horaires)
        </p>
        <textarea
          className="w-full border rounded p-2 h-32 font-mono text-sm"
          placeholder={
            "PAPS - Binôme\nQualifications\tIntervenants\tHoraires\tActions\nSecouriste\nLEBON SLOANE\n14/07/2026 12:00 - 14/07/2026 19:00\n..."
          }
          value={texteCollé}
          onChange={(e) => setTexteCollé(e.target.value)}
        />
        <button
          onClick={extraireDuTableau}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Extraire les intervenants
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          className="border rounded p-2"
          placeholder="Nom du poste (ex: 14 Juillet - PAPS)"
          value={poste}
          onChange={(e) => setPoste(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Horaires (ex: 12H - 19H)"
          value={horaires}
          onChange={(e) => setHoraires(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Heure de RDV (ex: 11h30)"
          value={heureRdv}
          onChange={(e) => setHeureRdv(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Lieu de RDV (ex: Nouveau PÔLE)"
          value={lieuRdv}
          onChange={(e) => setLieuRdv(e.target.value)}
        />
        <input
          className="border rounded p-2 col-span-2"
          placeholder="Lieu du poste (adresse)"
          value={lieuPoste}
          onChange={(e) => setLieuPoste(e.target.value)}
        />
        <input
          className="border rounded p-2 col-span-2"
          placeholder="Contact(s) sur place (ex: Hubert LOPEZ (06...) et Jacques SOULA (06...))"
          value={contacts}
          onChange={(e) => setContacts(e.target.value)}
        />
        <input
          className="border rounded p-2 col-span-2"
          placeholder="Véhicule (ex: Liaison RIFTER + sur place VPSP2)"
          value={vehicule}
          onChange={(e) => setVehicule(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <p className="font-semibold">Intervenants</p>
        {intervenants.map((i, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              className="border rounded p-2 w-48"
              value={i.role}
              onChange={(e) => updateIntervenant(idx, "role", e.target.value)}
            >
              {ROLES_COURANTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              className="border rounded p-2 flex-1"
              placeholder="Nom Prénom"
              value={i.nom}
              onChange={(e) => updateIntervenant(idx, "nom", e.target.value)}
            />
            {intervenants.length > 1 && (
              <button
                onClick={() => removeIntervenant(idx)}
                className="px-3 border rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addIntervenant} className="text-sm text-blue-600">
          + Ajouter un intervenant
        </button>
      </div>

      <button
        onClick={genererMessage}
        className="bg-red-600 text-white px-4 py-2 rounded font-semibold"
      >
        Générer le message
      </button>

      {message && (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-3 h-72 font-mono text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={copierMessage}
            className="bg-gray-800 text-white px-4 py-2 rounded"
          >
            {copied ? "Copié ✓" : "Copier le message"}
          </button>
        </div>
      )}
    </main>
  );
}