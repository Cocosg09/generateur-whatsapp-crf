"use client";

import { useEffect, useState } from "react";
import { styles } from "../../components/styles";

const CHAMPS = [
  { cle: "heureRdv", label: "Heure de RDV", placeholder: "ex :\n11h30\n13h30" },
  { cle: "lieuRdv", label: "Lieu de RDV", placeholder: "ex :\nNouveau Pôle" },
  { cle: "lieuPoste", label: "Lieu du poste", placeholder: "ex :\nPlace du Mercadal 09100 Pamiers" },
  { cle: "contacts", label: "Contact(s) sur place", placeholder: "ex :\nHubert LOPEZ (06.45.89.82.10)" },
];

function texteVersValeurs(texte) {
  return texte
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function ListesChampsTable() {
  const [listes, setListes] = useState({});
  const [textes, setTextes] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("/api/listes-champs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setListes(data);
        setTextes(
          Object.fromEntries(CHAMPS.map((c) => [c.cle, (data[c.cle] || []).join("\n")]))
        );
        setChargement(false);
      })
      .catch(() => {
        setErreur("Impossible de charger les listes de suggestions.");
        setChargement(false);
      });
  }, []);

  async function enregistrer(champ) {
    setErreur("");
    const valeurs = texteVersValeurs(textes[champ] || "");
    const res = await fetch("/api/listes-champs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ champ, valeurs }),
    });
    if (res.ok) {
      const next = await res.json();
      setListes(next);
      setTextes((prev) => ({ ...prev, [champ]: (next[champ] || []).join("\n") }));
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible d'enregistrer cette liste.");
    }
  }

  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>Suggestions des champs de poste</h2>
      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
        Une valeur par ligne. Elles apparaissent en menu déroulant au-dessus du
        champ correspondant, mais le champ reste toujours modifiable librement.
      </p>
      {erreur && (
        <div style={{ ...styles.previewBox, borderColor: "var(--rouge)" }}>{erreur}</div>
      )}
      {chargement && <p>Chargement…</p>}
      {!chargement && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {CHAMPS.map((c) => {
            const modifie = (textes[c.cle] || "") !== (listes[c.cle] || []).join("\n");
            return (
              <div key={c.cle} style={styles.fieldGroup}>
                <label style={styles.label}>{c.label}</label>
                <textarea
                  style={{ ...styles.textarea, height: "84px" }}
                  placeholder={c.placeholder}
                  value={textes[c.cle] || ""}
                  onChange={(e) =>
                    setTextes((prev) => ({ ...prev, [c.cle]: e.target.value }))
                  }
                />
                {modifie && (
                  <button
                    style={{ ...styles.btnSecondary, alignSelf: "flex-start", marginTop: "4px" }}
                    onClick={() => enregistrer(c.cle)}
                  >
                    Enregistrer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
