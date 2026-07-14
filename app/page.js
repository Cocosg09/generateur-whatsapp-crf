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

function nouveauPoste() {
  return {
    id: crypto.randomUUID(),
    poste: "",
    horaires: "",
    heureRdv: "",
    lieuRdv: "",
    lieuPoste: "",
    contacts: "",
    vehicule: "",
    intervenants: [{ role: "PSE", nom: "" }],
    texteCollé: "",
  };
}

export default function Home() {
  const [postes, setPostes] = useState([nouveauPoste()]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  function updatePoste(id, field, value) {
    setPostes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function ajouterPoste() {
    setPostes((prev) => [...prev, nouveauPoste()]);
  }

  function supprimerPoste(id) {
    setPostes((prev) => prev.filter((p) => p.id !== id));
  }

  function updateIntervenant(posteId, index, field, value) {
    setPostes((prev) =>
      prev.map((p) => {
        if (p.id !== posteId) return p;
        const next = [...p.intervenants];
        next[index] = { ...next[index], [field]: value };
        return { ...p, intervenants: next };
      })
    );
  }

  function addIntervenant(posteId) {
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? { ...p, intervenants: [...p.intervenants, { role: "PSE", nom: "" }] }
          : p
      )
    );
  }

  function removeIntervenant(posteId, index) {
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? { ...p, intervenants: p.intervenants.filter((_, i) => i !== index) }
          : p
      )
    );
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

  function extraireDuTableau(posteId) {
    setPostes((prev) =>
      prev.map((p) => {
        if (p.id !== posteId) return p;

        const lignes = p.texteCollé
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

        return {
          ...p,
          intervenants:
            nouveauxIntervenants.length > 0 ? nouveauxIntervenants : p.intervenants,
          horaires: horairesTrouvés || p.horaires,
        };
      })
    );
  }

  function genererMessage() {
    const blocsPostes = postes
      .map((p) => {
        const listeIntervenants = p.intervenants
          .filter((i) => i.nom.trim() !== "")
          .map((i) => `•⁠  ⁠${i.role} : ${i.nom}`)
          .join("\n");

        return `Poste ${p.poste} - ${p.horaires}

📍 RDV à ${p.heureRdv} au ${p.lieuRdv}
Lieux du poste: ${p.lieuPoste}
Contact sur place : ${p.contacts}

🚑
${listeIntervenants}

Véhicule: ${p.vehicule}`;
      })
      .join("\n\n---\n\n");

    const texte = `${blocsPostes}

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
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Générateur de message DPS</h1>

      {postes.map((p, posteIdx) => (
        <div key={p.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="font-bold">Poste {posteIdx + 1}</p>
            {postes.length > 1 && (
              <button
                onClick={() => supprimerPoste(p.id)}
                className="text-sm text-red-600"
              >
                Supprimer ce poste
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Coller le tableau (qualifications/intervenants/horaires)
            </p>
            <textarea
              className="w-full border rounded p-2 h-24 font-mono text-sm"
              value={p.texteCollé}
              onChange={(e) => updatePoste(p.id, "texteCollé", e.target.value)}
            />
            <button
              onClick={() => extraireDuTableau(p.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Extraire les intervenants
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Nom du poste (ex: 14 Juillet - PAPS)"
              value={p.poste}
              onChange={(e) => updatePoste(p.id, "poste", e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="Horaires (ex: 12H - 19H)"
              value={p.horaires}
              onChange={(e) => updatePoste(p.id, "horaires", e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="Heure de RDV (ex: 11h30)"
              value={p.heureRdv}
              onChange={(e) => updatePoste(p.id, "heureRdv", e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="Lieu de RDV"
              value={p.lieuRdv}
              onChange={(e) => updatePoste(p.id, "lieuRdv", e.target.value)}
            />
            <input
              className="border rounded p-2 col-span-2"
              placeholder="Lieu du poste (adresse)"
              value={p.lieuPoste}
              onChange={(e) => updatePoste(p.id, "lieuPoste", e.target.value)}
            />
            <input
              className="border rounded p-2 col-span-2"
              placeholder="Contact(s) sur place"
              value={p.contacts}
              onChange={(e) => updatePoste(p.id, "contacts", e.target.value)}
            />
            <input
              className="border rounded p-2 col-span-2"
              placeholder="Véhicule"
              value={p.vehicule}
              onChange={(e) => updatePoste(p.id, "vehicule", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-sm">Intervenants</p>
            {p.intervenants.map((i, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  className="border rounded p-2 w-48"
                  value={i.role}
                  onChange={(e) =>
                    updateIntervenant(p.id, idx, "role", e.target.value)
                  }
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
                  onChange={(e) =>
                    updateIntervenant(p.id, idx, "nom", e.target.value)
                  }
                />
                {p.intervenants.length > 1 && (
                  <button
                    onClick={() => removeIntervenant(p.id, idx)}
                    className="px-3 border rounded"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addIntervenant(p.id)}
              className="text-sm text-blue-600"
            >
              + Ajouter un intervenant
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={ajouterPoste}
        className="border-2 border-dashed border-gray-400 text-gray-600 px-4 py-2 rounded w-full"
      >
        + Ajouter un autre poste (ex: poste fixe en plus du PAPS)
      </button>

      <button
        onClick={genererMessage}
        className="bg-red-600 text-white px-4 py-2 rounded font-semibold w-full"
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