"use client";

import { useState, useMemo, useEffect, useRef } from "react";

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
  page: { minHeight: "100vh", background: "var(--nuage)" },
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
  headerActions: { display: "flex", gap: "8px" },
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
    flexWrap: "wrap",
    gap: "8px",
  },
  posteTitleWrap: { display: "flex", alignItems: "center", gap: "10px" },
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
  posteTitle: { fontWeight: 700, fontSize: "15px" },
  posteHeaderActions: { display: "flex", gap: "10px", alignItems: "center" },
  arrowBtn: {
    background: "#fff",
    border: "1px solid var(--trait)",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    color: "var(--encre)",
    fontSize: "13px",
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
  fieldGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "13px", fontWeight: 600, color: "var(--encre)" },
  required: { color: "var(--rouge)" },
  input: {
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "9px 10px",
    fontSize: "14px",
    background: "#fff",
    color: "var(--encre)",
    width: "100%",
  },
  inputInvalide: {
    border: "1px solid var(--rouge)",
    boxShadow: "0 0 0 1px var(--rouge)",
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
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fullSpan: { gridColumn: "1 / -1" },
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
  btnOutlinePrint: {
    background: "#fff",
    border: "1px solid var(--trait)",
    color: "var(--encre)",
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
  intervenantMainLine: { display: "flex", gap: "8px", alignItems: "center" },
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
  panelTitle: { fontWeight: 700, fontSize: "15px" },
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
    flexWrap: "wrap",
    gap: "6px",
  },
  histDate: { fontSize: "11px", color: "var(--muted)" },
  histActions: { display: "flex", gap: "10px" },
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
  finalBox: { display: "flex", flexDirection: "column", gap: "10px" },
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
  actionsRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  previewBox: {
    border: "1px dashed var(--rouge)",
    borderRadius: "8px",
    padding: "12px",
    background: "#fff5f5",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  searchInput: {
    border: "1px solid var(--trait)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    width: "100%",
  },
  syncBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff8e1",
    border: "1px solid #f0c14b",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
  },
};

function trouverRole(texte) {
  const t = texte.trim().toLowerCase();
  const trouve = ROLES_COURANTS.find((r) => r.toLowerCase() === t);
  return trouve || ROLES_COURANTS[0];
}

function extraireHeures(raw) {
  const match = raw.match(/(\d{2}):(\d{2}).*?(\d{2}):(\d{2})/);
  return match ? `${match[1]}H - ${match[3]}H` : "";
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

export default function Home() {
  const [postes, setPostes] = useState([nouveauPoste()]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [modeles, setModeles] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [preview, setPreview] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rechercheHistorique, setRechercheHistorique] = useState("");
  const [desynchronise, setDesynchronise] = useState(false);

  const lastSyncedRef = useRef("");
  const dernierEnregistreRef = useRef("");

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
    setModeles(await res.json());
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
    setModeles(await res.json());
  }

  function updatePoste(id, field, value) {
    setPostes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function ajouterPoste() {
    setPostes((prev) => [...prev, nouveauPoste()]);
  }

  function dupliquerPoste(posteId) {
    setPostes((prev) => {
      const idx = prev.findIndex((p) => p.id === posteId);
      if (idx === -1) return prev;
      const copie = {
        ...prev[idx],
        id: crypto.randomUUID(),
        intervenants: prev[idx].intervenants.map((i) => ({ ...i })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copie);
      return next;
    });
  }

  function deplacerPoste(posteId, direction) {
    setPostes((prev) => {
      const idx = prev.findIndex((p) => p.id === posteId);
      const cible = idx + direction;
      if (idx === -1 || cible < 0 || cible >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[cible]] = [next[cible], next[idx]];
      return next;
    });
  }

  function reinitialiser() {
    if (
      confirm(
        "Réinitialiser le formulaire ? Toutes les données saisies seront perdues."
      )
    ) {
      setPostes([nouveauPoste()]);
      setMessage("");
      setCopied(false);
      setSubmitAttempted(false);
      setPreview({});
      setDesynchronise(false);
      lastSyncedRef.current = "";
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

  function extraireDuTableau(posteId) {
    const poste = postes.find((p) => p.id === posteId);
    if (!poste) return;

    const lignes = poste.texteCollé
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    const headerIdx = lignes.findIndex((l) =>
      l.toLowerCase().includes("qualifications")
    );

    let nomPoste = "";
    if (headerIdx > 0) {
      const candidate = lignes[headerIdx - 1];
      const estBruit =
        /^\d+%$/.test(candidate) ||
        ["public", "privé", "secteur par défaut"].includes(
          candidate.toLowerCase()
        );
      if (!estBruit) nomPoste = candidate;
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

    setPreview((prev) => ({
      ...prev,
      [posteId]: {
        poste: nomPoste,
        horaires: horairesTrouvés,
        intervenants: nouveauxIntervenants,
      },
    }));
  }

  function confirmerExtraction(posteId) {
    const p = preview[posteId];
    if (!p) return;
    setPostes((prev) =>
      prev.map((x) =>
        x.id === posteId
          ? {
              ...x,
              poste: p.poste || x.poste,
              horaires: p.horaires || x.horaires,
              intervenants:
                p.intervenants.length > 0 ? p.intervenants : x.intervenants,
            }
          : x
      )
    );
    setPreview((prev) => {
      const next = { ...prev };
      delete next[posteId];
      return next;
    });
  }

  function annulerExtraction(posteId) {
    setPreview((prev) => {
      const next = { ...prev };
      delete next[posteId];
      return next;
    });
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
            ? `\n\n🎒 Matériel à apporter\n${materielLignes
                .map((l) => `• ${l}`)
                .join("\n")}`
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

  // Synchronise automatiquement le message avec le formulaire,
  // sauf si l'utilisateur a modifié le texte à la main.
  useEffect(() => {
    setMessage((prev) => {
      if (prev === lastSyncedRef.current) {
        lastSyncedRef.current = apercu;
        return apercu;
      }
      setDesynchronise(true);
      return prev;
    });
  }, [apercu]);

  function resynchroniser() {
    setMessage(apercu);
    lastSyncedRef.current = apercu;
    setDesynchronise(false);
  }

  async function sauvegarderDansHistoriqueSiNecessaire() {
    if (message === dernierEnregistreRef.current) return;
    dernierEnregistreRef.current = message;
    const entree = {
      id: crypto.randomUUID(),
      texte: message,
      date: new Date().toISOString(),
    };
    const res = await fetch("/api/historique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entree),
    });
    setHistorique(await res.json());
  }

  async function supprimerDeLHistorique(id) {
    if (!confirm("Supprimer ce message de l'historique ?")) return;
    const res = await fetch("/api/historique", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setHistorique(await res.json());
  }

  function copierDepuisHistorique(texte) {
    navigator.clipboard.writeText(texte);
    alert("Message copié !");
  }

  function chargerDepuisHistorique(texte) {
    if (
      !confirm(
        "Remplacer le formulaire actuel par ce message de l'historique ?"
      )
    )
      return;

    const zonePostes = texte.split("\n\n⚠️RAPPEL SUR LES VÉHICULES")[0];
    const blocs = zonePostes.split("\n\n---\n\n");

    const postesParsed = blocs.map((bloc) => {
      const posteMatch = bloc.match(/^Poste (.+?) - (.+)$/m);
      const rdvMatch = bloc.match(/RDV à (.+?) au (.+)$/m);
      const lieuMatch = bloc.match(/Lieux du poste: (.+)$/m);
      const contactMatch = bloc.match(/Contact sur place : (.+)$/m);
      const vehiculeMatch = bloc.match(/Véhicule: (.+)$/m);
      const materielMatch = bloc.match(/🎒 Matériel à apporter\n([\s\S]+)$/);

      const intervenants = [];
      const lignesIntervenants = bloc.match(/^• .+$/gm) || [];
      lignesIntervenants.forEach((ligne) => {
        const m = ligne.match(/^• (.+?)(?: \(Conducteur (VL|VPSP)\))? : (.+)$/);
        if (m) {
          intervenants.push({
            role: trouverRole(m[1]),
            nom: m[3],
            conducteur: !!m[2],
            typeVehicule: m[2] || "VL",
          });
        }
      });

      return {
        id: crypto.randomUUID(),
        poste: posteMatch ? posteMatch[1] : "",
        horaires: posteMatch ? posteMatch[2] : "",
        heureRdv: rdvMatch ? rdvMatch[1] : "",
        lieuRdv: rdvMatch ? rdvMatch[2] : "",
        lieuPoste: lieuMatch ? lieuMatch[1] : "",
        contacts: contactMatch ? contactMatch[1] : "",
        vehicule: vehiculeMatch ? vehiculeMatch[1] : "",
        materiel: materielMatch
          ? materielMatch[1]
              .split("\n")
              .map((l) => l.replace(/^• /, "").trim())
              .filter(Boolean)
              .join("\n")
          : "",
        intervenants:
          intervenants.length > 0
            ? intervenants
            : [{ role: "PSE", nom: "", conducteur: false, typeVehicule: "VL" }],
        texteCollé: "",
      };
    });

    setPostes(postesParsed);
    setDesynchronise(false);
    setSubmitAttempted(false);
    setAfficherHistorique(false);
  }

  function copierMessage() {
    setSubmitAttempted(true);
    navigator.clipboard.writeText(message);
    setCopied(true);
    sauvegarderDansHistoriqueSiNecessaire();
  }

  function envoyerWhatsApp() {
    setSubmitAttempted(true);
    const texteEncode = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${texteEncode}`, "_blank");
    sauvegarderDansHistoriqueSiNecessaire();
  }

  function imprimer() {
    setSubmitAttempted(true);
    sauvegarderDansHistoriqueSiNecessaire();
    window.print();
  }

  const historiqueFiltre = useMemo(() => {
    if (!rechercheHistorique.trim()) return historique;
    const q = rechercheHistorique.toLowerCase();
    return historique.filter(
      (h) =>
        h.texte.toLowerCase().includes(q) ||
        formaterDate(h.date).toLowerCase().includes(q)
    );
  }, [historique, rechercheHistorique]);

  function champStyle(valeur) {
    return submitAttempted && !valeur.trim()
      ? { ...styles.input, ...styles.inputInvalide }
      : styles.input;
  }

  return (
    <div style={styles.page}>
      <header style={styles.header} className="no-print">
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
          <section style={styles.panel} className="no-print">
            <p style={styles.panelTitle}>Historique des messages générés</p>
            <input
              style={styles.searchInput}
              placeholder="Rechercher par texte ou date..."
              value={rechercheHistorique}
              onChange={(e) => setRechercheHistorique(e.target.value)}
            />
            {historiqueFiltre.length === 0 && (
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Aucun message trouvé.
              </p>
            )}
            {historiqueFiltre.map((h) => (
              <div key={h.id} style={styles.histItem}>
                <div style={styles.histTop}>
                  <span style={styles.histDate}>{formaterDate(h.date)}</span>
                  <div style={styles.histActions}>
                    <button
                      style={{ ...styles.linkBtn, color: "var(--rouge)" }}
                      onClick={() => chargerDepuisHistorique(h.texte)}
                    >
                      Charger dans le formulaire
                    </button>
                    <button
                      style={{ ...styles.linkBtn, color: "var(--encre)" }}
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
          <div key={p.id} style={styles.posteCard} className="no-print">
            <div style={styles.posteHeader}>
              <div style={styles.posteTitleWrap}>
                <span style={styles.badge}>{posteIdx + 1}</span>
                <span style={styles.posteTitle}>Poste {posteIdx + 1}</span>
              </div>
              <div style={styles.posteHeaderActions}>
                <button
                  style={styles.arrowBtn}
                  disabled={posteIdx === 0}
                  onClick={() => deplacerPoste(p.id, -1)}
                  aria-label="Monter ce poste"
                >
                  ↑
                </button>
                <button
                  style={styles.arrowBtn}
                  disabled={posteIdx === postes.length - 1}
                  onClick={() => deplacerPoste(p.id, 1)}
                  aria-label="Descendre ce poste"
                >
                  ↓
                </button>
                <button
                  style={styles.btnSecondary}
                  onClick={() => dupliquerPoste(p.id)}
                >
                  Dupliquer
                </button>
                {postes.length > 1 && (
                  <button
                    style={styles.dangerLink}
                    onClick={() => supprimerPoste(p.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
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

              {preview[p.id] && (
                <div style={styles.previewBox}>
                  <p style={styles.sectionLabel}>
                    Aperçu de l'extraction — à confirmer
                  </p>
                  <p style={{ fontSize: "13px" }}>
                    <strong>Poste :</strong>{" "}
                    {preview[p.id].poste || "(non détecté)"}
                  </p>
                  <p style={{ fontSize: "13px" }}>
                    <strong>Horaires :</strong>{" "}
                    {preview[p.id].horaires || "(non détectés)"}
                  </p>
                  <ul style={{ fontSize: "13px", margin: 0, paddingLeft: "18px" }}>
                    {preview[p.id].intervenants.map((i, idx) => (
                      <li key={idx}>
                        {i.role} — {i.nom}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button
                      style={styles.btnSecondary}
                      onClick={() => confirmerExtraction(p.id)}
                    >
                      Confirmer
                    </button>
                    <button
                      style={{ ...styles.linkBtn, color: "var(--muted)" }}
                      onClick={() => annulerExtraction(p.id)}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.grid2}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Nom du poste <span style={styles.required}>*</span>
                </label>
                <input
                  style={champStyle(p.poste)}
                  placeholder="ex : 14 Juillet - PAPS"
                  value={p.poste}
                  onChange={(e) => updatePoste(p.id, "poste", e.target.value)}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Horaires <span style={styles.required}>*</span>
                </label>
                <input
                  style={champStyle(p.horaires)}
                  placeholder="ex : 12H - 19H"
                  value={p.horaires}
                  onChange={(e) => updatePoste(p.id, "horaires", e.target.value)}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Heure de RDV</label>
                <input
                  style={styles.input}
                  placeholder="ex : 11h30"
                  value={p.heureRdv}
                  onChange={(e) => updatePoste(p.id, "heureRdv", e.target.value)}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Lieu de RDV</label>
                <input
                  style={styles.input}
                  placeholder="ex : Nouveau PÔLE"
                  value={p.lieuRdv}
                  onChange={(e) => updatePoste(p.id, "lieuRdv", e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>
                  Lieu du poste (adresse) <span style={styles.required}>*</span>
                </label>
                <input
                  style={champStyle(p.lieuPoste)}
                  value={p.lieuPoste}
                  onChange={(e) => updatePoste(p.id, "lieuPoste", e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>
                  Contact(s) sur place <span style={styles.required}>*</span>
                </label>
                <input
                  style={champStyle(p.contacts)}
                  placeholder="Nom (06...) et Nom (06...)"
                  value={p.contacts}
                  onChange={(e) => updatePoste(p.id, "contacts", e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
                <label style={styles.label}>
                  Véhicule <span style={styles.required}>*</span>
                </label>
                <input
                  style={champStyle(p.vehicule)}
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
              <button style={styles.addLink} onClick={() => addIntervenant(p.id)}>
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

        <button style={styles.btnDashed} className="no-print" onClick={ajouterPoste}>
          + Ajouter un autre poste (ex : poste fixe en plus du PAPS)
        </button>

        {modeles.length > 0 && (
          <section style={styles.panel} className="no-print">
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

        <section style={styles.finalBox} className="print-area">
          <p style={styles.sectionLabel}>Message (édition en direct)</p>

          {desynchronise && (
            <div style={styles.syncBanner} className="no-print">
              <span>
                Vous avez modifié ce texte à la main — il ne se met plus à jour
                automatiquement avec le formulaire.
              </span>
              <button style={styles.linkBtn} onClick={resynchroniser}>
                Resynchroniser
              </button>
            </div>
          )}

          <textarea
            style={styles.finalTextarea}
            className="no-print"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setCopied(false);
            }}
          />
          <pre
            style={{ ...styles.apercuBox, display: "none" }}
            className="print-only"
          >
            {message}
          </pre>
          <div style={styles.actionsRow} className="no-print">
            <button style={styles.btnDark} onClick={copierMessage}>
              {copied ? "Copié ✓" : "Copier le message"}
            </button>
            <button style={styles.btnWhatsapp} onClick={envoyerWhatsApp}>
              Envoyer sur WhatsApp
            </button>
            <button style={styles.btnOutlinePrint} onClick={imprimer}>
              Imprimer / Exporter en PDF
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}