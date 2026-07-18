"use client";

import { useEffect, useState } from "react";
import { styles } from "../../components/styles";

export default function PiedMessageForm() {
  const [texteEnregistre, setTexteEnregistre] = useState("");
  const [texte, setTexte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("/api/pied-message")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setTexteEnregistre(data.texte || "");
        setTexte(data.texte || "");
        setChargement(false);
      })
      .catch(() => {
        setErreur("Impossible de charger le pied de message.");
        setChargement(false);
      });
  }, []);

  async function enregistrer() {
    setErreur("");
    const res = await fetch("/api/pied-message", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte }),
    });
    if (res.ok) {
      const data = await res.json();
      setTexteEnregistre(data.texte || "");
      setTexte(data.texte || "");
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible d'enregistrer le pied de message.");
    }
  }

  const modifie = texte !== texteEnregistre;

  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>Pied de message</h2>
      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
        Texte commun ajouté à la fin de tous les messages générés (aujourd&apos;hui
        le rappel véhicules, mais son contenu peut évoluer). Laissez vide pour
        ne rien ajouter.
      </p>
      {erreur && (
        <div style={{ ...styles.previewBox, borderColor: "var(--rouge)" }}>{erreur}</div>
      )}
      {chargement && <p>Chargement…</p>}
      {!chargement && (
        <div style={styles.fieldGroup}>
          <textarea
            style={{ ...styles.textarea, height: "160px" }}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
          {modifie && (
            <button
              style={{ ...styles.btnSecondary, alignSelf: "flex-start", marginTop: "4px" }}
              onClick={enregistrer}
            >
              Enregistrer
            </button>
          )}
        </div>
      )}
    </section>
  );
}
