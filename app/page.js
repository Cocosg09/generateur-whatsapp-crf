"use client";

import { useState } from "react";

export default function Home() {
  const [poste, setPoste] = useState("");
  const [horaires, setHoraires] = useState("");
  const [heureRdv, setHeureRdv] = useState("");
  const [lieuRdv, setLieuRdv] = useState("");
  const [lieuPoste, setLieuPoste] = useState("");
  const [contacts, setContacts] = useState("");
  const [pse, setPse] = useState([""]);
  const [vehicule, setVehicule] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  function updatePse(index, value) {
    const next = [...pse];
    next[index] = value;
    setPse(next);
  }

  function addPse() {
    setPse([...pse, ""]);
  }

  function removePse(index) {
    setPse(pse.filter((_, i) => i !== index));
  }

  function genererMessage() {
    const listePse = pse
      .filter((p) => p.trim() !== "")
      .map((p) => `•⁠  ⁠PSE : ${p}`)
      .join("\n");

    const texte = `Poste ${poste} - ${horaires}

📍 RDV à ${heureRdv} au ${lieuRdv}
Lieux du poste: ${lieuPoste}
Contact sur place : ${contacts}

🚑
${listePse}

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
        <p className="font-semibold">Liste des PSE</p>
        {pse.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="border rounded p-2 flex-1"
              placeholder="Nom Prénom"
              value={p}
              onChange={(e) => updatePse(i, e.target.value)}
            />
            {pse.length > 1 && (
              <button
                onClick={() => removePse(i)}
                className="px-3 border rounded"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={addPse} className="text-sm text-blue-600">
          + Ajouter un PSE
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