"use client";

import { useState, useMemo, useEffect } from "react";

const ROLES_COURANTS = [
  "PSE",
  "Secouriste",
  "Équipier secouriste",
  "Chef de poste",
  "Chef d'intervention",
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
    materiel: "",
    intervenants: [
      { role: "PSE", nom: "", conducteur: false, typeVehicule: "VL" },
    ],
    texteCollé: "",
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--nuage)",
  },
  header: {
    background: "var(--rouge)",
    color: "#fff",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
  },
  ghostBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "24px 16px 64px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  posteCard: {
    background: "var(--papier)",
    border: "1px solid var(--trait)",
    borderLeft: "4px solid var(--rouge)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--ombre)",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  posteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  posteTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    background: "var(--rouge)",
    color: "#fff",
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    flexShrink: 0,
  },
  posteTitle: {
    fontWeight: 700,
    fontSize: "15px",
  },
  dangerLink: {
    background: "none",
    border: "none",
    color: "var(--rouge)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--muted)",
    marginBottom: "8px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--encre)",
  },
  input: {
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "9px 10px",
    fontSize: "14px",
    background: "#fff",
    color: "var(--encre)",
    width: "100%",
  },
  textarea: {
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "9px 10px",
    fontSize: "13px",
    fontFamily: "ui-monospace, Menlo, monospace",
    background: "#fff",
    color: "var(--encre)",
    width: "100%",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  fullSpan: {
    gridColumn: "1 / -1",
  },
  btnSecondary: {
    background: "#fff",
    border: "1px solid var(--trait)",
    color: "var(--encre)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  btnDashed: {
    background: "transparent",
    border: "2px dashed var(--trait)",
    color: "var(--muted)",
    borderRadius: "var(--radius)",
    padding: "14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },
  btnPrimary: {
    background: "var(--rouge)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  },
  btnWhatsapp: {
    background: "var(--whatsapp)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    flex: 1,
  },
  btnDark: {
    background: "var(--encre)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    flex: 1,
  },
  intervenantRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "10px",
    background: "var(--nuage)",
  },
  intervenantMainLine: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  conducteurLine: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    fontSize: "13px",
    paddingLeft: "2px",
  },
  removeBtn: {
    background: "#fff",
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    color: "var(--muted)",
    flexShrink: 0,
  },
  addLink: {
    background: "none",
    border: "none",
    color: "var(--rouge)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },
  apercuBox: {
    background: "var(--nuage)",
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "13px",
    whiteSpace: "pre-wrap",
    color: "var(--encre)",
    margin: 0,
    fontFamily: "ui-monospace, Menlo, monospace",
  },
  panel: {
    background: "var(--papier)",
    border: "1px solid var(--trait)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--ombre)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  panelTitle: {
    fontWeight: 700,
    fontSize: "15px",
  },
  histItem: {
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "12px",
    background: "var(--nuage)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  histTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  histDate: {
    fontSize: "11px",
    color: "var(--muted)",
  },
  histActions: {
    display: "flex",
    gap: "10px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },
  modeleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
  },
  finalBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  finalTextarea: {
    width: "100%",
    minHeight: "280px",
    border: "1px solid var(--trait)",
    borderRadius: "var(--radius)",
    padding: "14px",
    fontSize: "13px",
    fontFamily: "ui-monospace, Menlo, monospace",
    background: "#fff",
    color: "var(--encre)",
  },
  actionsRow: {
    display: "flex",
    gap: "8px",
  },
  backLink: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: "13px",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    alignSelf: "flex-start",
  },
};

function Champ({ label, ...props }) {
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} {...props} />
    </div>
  );
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
          ? {
              ...p,
              intervenants: [
                ...p.intervenants,
                { role: "PSE", nom: "", conducteur: false, typeVehicule: "VL" },
              ],
            }
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

        let nomPoste = "";
        if (headerIdx > 0) {
          const candidate = lignes[headerIdx - 1];
          const aIgnorer = ["public", "privé", "100%", "secteur par défaut"];
          if (!aIgnorer.includes(candidate.toLowerCase())) {
            nomPoste = candidate;
          }
        }

        const donnees = headerIdx !== -1 ? lignes.slice(headerIdx + 1) : lignes;

        const nouveauxIntervenants = [];
        let horairesTrouvés = "";

        for (let i = 0; i < donnees.length; i += 3) {
          const role = donnees[i];
          const nom = donnees[i + 1];
          const horairesRaw = donnees[i + 2];
          if (role && nom) {
            nouveauxIntervenants.push({
              role: trouverRole(role),
              nom,
              conducteur: false,
              typeVehicule: "VL",
            });
            if (!horairesTrouvés && horairesRaw) {
              horairesTrouvés = extraireHeures(horairesRaw);
            }
          }
        }

        return {
          ...p,
          poste: nomPoste || p.poste,
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
          .map((i) => {
            const suffixe = i.conducteur ? ` (Conducteur ${i.typeVehicule})` : "";
            return `• ${i.role}${suffixe} : ${i.nom}`;
          })
          .join("\n");

        const materielLignes = p.materiel
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l !== "");
        const blocMateriel =
          materielLignes.length > 0
            ? `\n\n🎒 Matériel à apporter\n${materielLignes.map((l) => `• ${l}`).join("\n")}`
            : "";

        return `Poste ${p.poste} - ${p.horaires}

📍 RDV à ${p.heureRdv} au ${p.lieuRdv}
Lieux du poste: ${p.lieuPoste}
Contact sur place : ${p.contacts}

🚑
${listeIntervenants}

Véhicule: ${p.vehicule}${blocMateriel}`;
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
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <span aria-hidden="true">✚</span>
          Générateur de message DPS
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.ghostBtn}
            onClick={() => setAfficherHistorique(!afficherHistorique)}
          >
            Historique
          </button>
          <button style={styles.ghostBtn} onClick={reinitialiser}>
            Réinitialiser
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {afficherHistorique && (
          <section style={styles.panel}>
            <p style={styles.panelTitle}>Historique des messages générés</p>
            {historique.length === 0 && (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Aucun message généré pour l'instant.
              </p>
            )}
            {historique.map((h) => (
              <div key={h.id} style={styles.histItem}>
                <div style={styles.histTop}>
                  <span style={styles.histDate}>{formaterDate(h.date)}</span>
                  <div style={styles.histActions}>
                    <button
                      style={{ ...styles.linkBtn, color: "var(--rouge)" }}
                      onClick={() => copierDepuisHistorique(h.texte)}
                    >
                      Copier
                    </button>
                    <button
                      style={{ ...styles.linkBtn, color: "var(--muted)" }}
                      onClick={() => supprimerDeLHistorique(h.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <pre style={{ ...styles.apercuBox, fontSize: "12px" }}>
                  {h.texte}
                </pre>
              </div>
            ))}
          </section>
        )}

        {postes.map((p, posteIdx) => (
          <div key={p.id} style={styles.posteCard}>
            <div style={styles.posteHeader}>
              <div style={styles.posteTitleWrap}>
                <span style={styles.badge}>{posteIdx + 1}</span>
                <span style={styles.posteTitle}>Poste {posteIdx + 1}</span>
              </div>
              {postes.length > 1 && (
                <button
                  style={styles.dangerLink}
                  onClick={() => supprimerPoste(p.id)}
                >
                  Supprimer ce poste
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                style={{ ...styles.input, width: "auto" }}
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
                style={styles.btnSecondary}
                onClick={() => enregistrerModele(p)}
              >
                Enregistrer comme modèle
              </button>
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.sectionLabel}>
                Tableau collé (qualifications / intervenants / horaires)
              </p>
              <textarea
                style={{ ...styles.textarea, height: "96px" }}
                value={p.texteCollé}
                onChange={(e) => updatePoste(p.id, "texteCollé", e.target.value)}
                placeholder={"Qualifications\tIntervenants\tHoraires\n..."}
              />
              <button
                style={{ ...styles.btnSecondary, marginTop: "4px" }}
                onClick={() => extraireDuTableau(p.id)}
              >
                Extraire les intervenants
              </button>
            </div>

            <div style={styles.grid2}>
              <Champ
                label="Nom du poste"
                placeholder="ex : 14 Juillet - PAPS"
                value={p.poste}
                onChange={(e) => updatePoste(p.id, "poste", e.target.value)}
              />
              <Champ
                label="Horaires"
                placeholder="ex : 12H - 19H"
                value={p.horaires}
                onChange={(e) => updatePoste(p.id, "horaires", e.target.value)}
              />
              <Champ
                label="Heure de RDV"
                placeholder="ex : 11h30"
                value={p.heureRdv}
                onChange={(e) => updatePoste(p.id, "heureRdv", e.target.value)}
              />
              <Champ
                label="Lieu de RDV"
                placeholder="ex : Nouveau PÔLE"
                value={p.lieuRdv}
                onChange={(e) => updatePoste(p.id, "lieuRdv", e.target.value)}
              />
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>Lieu du poste (adresse)</label>
                <input
                  style={styles.input}
                  value={p.lieuPoste}
                  onChange={(e) => updatePoste(p.id, "lieuPoste", e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>Contact(s) sur place</label>
                <input
                  style={styles.input}
                  placeholder="Nom (06...) et Nom (06...)"
                  value={p.contacts}
                  onChange={(e) => updatePoste(p.id, "contacts", e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>Véhicule</label>
                <input
                  style={styles.input}
                  placeholder="ex : Liaison RIFTER + sur place VPSP2"
                  value={p.vehicule}
                  onChange={(e) => updatePoste(p.id, "vehicule", e.target.value)}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.sectionLabel}>Intervenants</p>
              {p.intervenants.map((i, idx) => (
                <div key={idx} style={styles.intervenantRow}>
                  <div style={styles.intervenantMainLine}>
                    <select
                      style={{ ...styles.input, width: "170px", flexShrink: 0 }}
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
                      style={styles.input}
                      placeholder="Nom Prénom"
                      value={i.nom}
                      onChange={(e) =>
                        updateIntervenant(p.id, idx, "nom", e.target.value)
                      }
                    />
                    {p.intervenants.length > 1 && (
                      <button
                        style={styles.removeBtn}
                        onClick={() => removeIntervenant(p.id, idx)}
                        aria-label="Retirer cet intervenant"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <label style={styles.conducteurLine}>
                    <input
                      type="checkbox"
                      checked={i.conducteur}
                      onChange={(e) =>
                        updateIntervenant(p.id, idx, "conducteur", e.target.checked)
                      }
                    />
                    Conducteur
                    {i.conducteur && (
                      <select
                        style={{ ...styles.input, width: "90px", padding: "4px 6px" }}
                        value={i.typeVehicule}
                        onChange={(e) =>
                          updateIntervenant(p.id, idx, "typeVehicule", e.target.value)
                        }
                      >
                        <option value="VL">VL</option>
                        <option value="VPSP">VPSP</option>
                      </select>
                    )}
                  </label>
                </div>
              ))}
              <button
                style={styles.addLink}
                onClick={() => addIntervenant(p.id)}
              >
                + Ajouter un intervenant
              </button>
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.sectionLabel}>Matériel à apporter</p>
              <textarea
                style={{ ...styles.textarea, height: "72px" }}
                placeholder={"Un lot par ligne, ex :\nLot O2\nLot PSE1\nDSA"}
                value={p.materiel}
                onChange={(e) => updatePoste(p.id, "materiel", e.target.value)}
              />
            </div>
          </div>
        ))}

        <button style={styles.btnDashed} onClick={ajouterPoste}>
          + Ajouter un autre poste (ex : poste fixe en plus du PAPS)
        </button>

        {modeles.length > 0 && (
          <section style={styles.panel}>
            <p style={styles.panelTitle}>Modèles enregistrés</p>
            {modeles.map((m) => (
              <div key={m.id} style={styles.modeleRow}>
                <span>{m.nom}</span>
                <button
                  style={{ ...styles.linkBtn, color: "var(--rouge)" }}
                  onClick={() => supprimerModele(m.id)}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </section>
        )}

        {!message && (
          <section style={styles.fieldGroup}>
            <p style={styles.sectionLabel}>Aperçu en temps réel</p>
            <pre style={styles.apercuBox}>{apercu}</pre>
          </section>
        )}

        {!message && (
          <button style={styles.btnPrimary} onClick={genererMessage}>
            Générer le message
          </button>
        )}

        {message && (
          <section style={styles.finalBox}>
            <p style={styles.sectionLabel}>Message final</p>
            <textarea
              style={styles.finalTextarea}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div style={styles.actionsRow}>
              <button style={styles.btnDark} onClick={copierMessage}>
                {copied ? "Copié ✓" : "Copier le message"}
              </button>
              <button style={styles.btnWhatsapp} onClick={envoyerWhatsApp}>
                Envoyer sur WhatsApp
              </button>
            </div>
            <button style={styles.backLink} onClick={() => setMessage("")}>
              ← Revenir à l'édition / aperçu
            </button>
          </section>
        )}
      </main>
    </div>
  );
}