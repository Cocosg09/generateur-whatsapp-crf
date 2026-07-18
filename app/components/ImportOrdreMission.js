"use client";

import { useRef, useState } from "react";
import { styles } from "./styles";

export default function ImportOrdreMission({ onConfirmer }) {
  const inputRef = useRef(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [postesDetectes, setPostesDetectes] = useState(null);

  async function traiterFichier(fichier) {
    if (!fichier) return;
    setEnCours(true);
    setErreur("");
    setPostesDetectes(null);
    try {
      const { extraireItemsDuPdf } = await import("@/lib/pdfLignes");
      const { extraireOrdreMission } = await import("@/lib/dps");
      const buffer = await fichier.arrayBuffer();
      const pages = await extraireItemsDuPdf(buffer);
      const postes = pages.flatMap((items) => extraireOrdreMission(items));
      if (postes.length === 0) {
        setErreur(
          "Aucune information exploitable n'a été trouvée dans ce PDF. Vérifiez qu'il s'agit bien d'un ordre de mission généré par le logiciel de la Croix-Rouge."
        );
      } else {
        setPostesDetectes(postes);
      }
    } catch (err) {
      console.error("Import ordre de mission:", err);
      setErreur("Impossible de lire ce PDF, réessayez ou saisissez les informations à la main.");
    } finally {
      setEnCours(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function confirmer() {
    onConfirmer(postesDetectes);
    setPostesDetectes(null);
  }

  function annuler() {
    setPostesDetectes(null);
  }

  return (
    <section style={styles.panel} className="no-print">
      <p style={styles.panelTitle}>Importer un ordre de mission (PDF)</p>
      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
        Sélectionnez le PDF « Ordre de mission » généré par le logiciel de la
        Croix-Rouge : le poste, les horaires, le lieu, le contact et les
        intervenants seront proposés en aperçu avant d&apos;être ajoutés.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => traiterFichier(e.target.files?.[0])}
        disabled={enCours}
      />
      {enCours && <p style={{ fontSize: "13px", color: "var(--muted)" }}>Lecture du PDF…</p>}
      {erreur && <p style={{ fontSize: "13px", color: "var(--rouge)" }}>{erreur}</p>}

      {postesDetectes && (
        <div style={styles.previewBox}>
          <p style={styles.sectionLabel}>
            {postesDetectes.length > 1
              ? `${postesDetectes.length} postes détectés — à confirmer`
              : "Poste détecté — à confirmer"}
          </p>
          {postesDetectes.map((p, idx) => (
            <div key={idx} style={{ marginBottom: "10px", fontSize: "13px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{p.poste || "(nom non détecté)"}</p>
              <p style={{ margin: "0 0 4px" }}>
                <strong>Horaires :</strong> {p.horaires || "(non détectés)"}
              </p>
              <p style={{ margin: "0 0 4px" }}>
                <strong>Lieu :</strong> {p.lieuPoste || "(non détecté)"}
              </p>
              <p style={{ margin: "0 0 4px" }}>
                <strong>Contact :</strong> {p.contacts || "(non détecté)"}
              </p>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {p.intervenants.map((i, iIdx) => (
                  <li key={iIdx}>
                    {i.role} — {i.nom}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <button style={styles.btnSecondary} onClick={confirmer}>
              Ajouter au formulaire
            </button>
            <button style={{ ...styles.linkBtn, color: "var(--muted)" }} onClick={annuler}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
