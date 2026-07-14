"use client";

import { useState, useMemo, useEffect } from "react";

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
  const [modeles, setModeles] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [afficherHistorique, setAfficherHistorique] = useState(false);

  useEffect(() => {
    fetch("/api/modeles")
      .then((res) => res.json())
      .then(setModeles)
      .catch(() => setModeles([]));

    fetch("/api/historique")
      .then((res) => res.json())
      .then(setHistorique)
      .catch(() => setHistorique([]));
  }, []);

  async function enregistrerModele(p) {
    const nom = prompt("Nom du modèle (ex: PAPS Pamiers)");
    if (!nom) return;
    const nouveauModele = {
      id: crypto.randomUUID(),
      nom,
      heureRdv: p.heureRdv,
      lieuRdv: p.lieuRdv,
      lieuPoste: p.lieuPoste,
      contacts: p.contacts,
      vehicule: p.vehicule,
    };
    const res = await fetch("/api/modeles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nouveauModele),
    });
    const next = await res.json();
    setModeles(next);
  }

  function chargerModele(posteId, modeleId) {
    const m = modeles.find((x) => x.id === modeleId);
    if (!m) return;
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? {
              ...p,
              heureRdv: m.heureRdv,
              lieuRdv: m.lieuRdv,
              lieuPoste: m.lieuPoste,
              contacts: m.contacts,
              vehicule: m.vehicule,
            }
          : p
      )
    );
  }

  async function supprimerModele(modeleId) {
    if (!confirm("Supprimer ce modèle ?")) return;
    const res = await fetch("/api/modeles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modeleId }),
    });
    const next = await res.json();
    setModeles(next);
  }

  function updatePoste(id, field, value) {
    setPostes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function ajouterPoste() {
    setPostes((prev) => [...prev, nouveauPoste()]);
  }

  function reinitialiser() {
    if (confirm("Réinitialiser le formulaire ? Toutes les données saisies seront perdues.")) {
      setPostes([nouveauPoste()]);
      setMessage("");
      setCopied(false);
    }
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

  function construireMessage() {
    const blocsPostes = postes
      .map((p) => {
        const listeIntervenants = p.intervenants
          .filter((i) => i.nom.trim() !== "")
          .map((i) => `• ${i.role} : ${i.nom}`)
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

    return `${blocsPostes}

⚠️RAPPEL SUR LES VÉHICULES ⚠️
Merci de remplir les carnet de bord
Prêter une attention particulière à votre conduite
Prêter attention à l'état intérieur du véhicule
Et de faire le plein si besoin

Merci à tous et bon poste ! 👍
Dispo par message privé au besoin :)`;
  }

  const apercu = useMemo(() => construireMessage(), [postes]);

  async function sauvegarderDansHistorique(texte) {
    const entree = {
      id: crypto.randomUUID(),
      texte,
      date: new Date().toISOString(),
    };
    const res = await fetch("/api/historique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entree),
    });
    const next = await res.json();
    setHistorique(next);
  }

  async function supprimerDeLHistorique(id) {
    if (!confirm("Supprimer ce message de l'historique ?")) return;
    const res = await fetch("/api/historique", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const next = await res.json();
    setHistorique(next);
  }

  function copierDepuisHistorique(texte) {
    navigator.clipboard.writeText(texte);
    alert("Message copié !");
  }

  function formaterDate(iso) {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function genererMessage() {
    const texte = construireMessage();
    setMessage(texte);
    setCopied(false);
    sauvegarderDansHistorique(texte);
  }

  function copierMessage() {
    navigator.clipboard.writeText(message);
    setCopied(true);
  }

  function envoyerWhatsApp() {
    const texteEncode = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${texteEncode}`, "_blank");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Générateur de message DPS</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setAfficherHistorique(!afficherHistorique)}
            className="text-sm text-gray-600 border rounded px-3 py-1"
          >
            🕓 Historique
          </button>
          <button
            onClick={reinitialiser}
            className="text-sm text-gray-600 border rounded px-3 py-1"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {afficherHistorique && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50" style={{ color: "#111827" }}>
          <p className="font-bold">Historique des messages générés</p>
          {historique.length === 0 && (
            <p className="text-sm text-gray-500">Aucun message généré pour l'instant.</p>
          )}
          {historique.map((h) => (
            <div key={h.id} className="border rounded p-3 bg-white space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{formaterDate(h.date)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => copierDepuisHistorique(h.texte)}
                    className="text-xs text-blue-600"
                  >
                    Copier
                  </button>
                  <button
                    onClick={() => supprimerDeLHistorique(h.id)}
                    className="text-xs text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs">{h.texte}</pre>
            </div>
          ))}
        </div>
      )}

      {postes.map((p, posteIdx) => (
        <div
          key={p.id}
          className="border rounded-lg p-4 space-y-4"
          style={{ backgroundColor: "#000000", color: "#f6f9ff" }}
        >
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

          <div className="flex gap-2 items-center flex-wrap">
            <select
              className="border rounded p-2 text-black"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) chargerModele(p.id, e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Charger un modèle...
              </option>
              {modeles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <button
              onClick={() => enregistrerModele(p)}
              className="text-sm border rounded px-3 py-2"
            >
              💾 Enregistrer comme modèle
            </button>
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
                  className="border rounded p-2 w-48 text-black"
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

      {modeles.length > 0 && (
        <div className="text-sm space-y-1">
          <p className="font-semibold text-gray-600">Modèles enregistrés</p>
          {modeles.map((m) => (
            <div key={m.id} className="flex justify-between items-center">
              <span>{m.nom}</span>
              <button
                onClick={() => supprimerModele(m.id)}
                className="text-red-600 text-xs"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      {!message && (
        <div className="space-y-2">
          <p className="font-semibold text-sm text-gray-600">Aperçu en temps réel</p>
          <pre
            className="w-full border rounded p-3 whitespace-pre-wrap text-sm"
            style={{ backgroundColor: "#f3f4f6", color: "#111827" }}
          >
            {apercu}
          </pre>
        </div>
      )}

      {!message && (
        <button
          onClick={genererMessage}
          className="bg-red-600 text-white px-4 py-2 rounded font-semibold w-full"
        >
          Générer le message
        </button>
      )}

      {message && (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-3 h-72 font-mono text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={copierMessage}
              className="bg-gray-800 text-white px-4 py-2 rounded"
            >
              {copied ? "Copié ✓" : "Copier le message"}
            </button>
            <button
              onClick={envoyerWhatsApp}
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
            >
              📲 Envoyer sur WhatsApp
            </button>
          </div>
          <button
            onClick={() => setMessage("")}
            className="text-sm text-gray-600 underline block"
          >
            ← Revenir à l'édition / aperçu
          </button>
        </div>
      )}
    </main>
  );
}