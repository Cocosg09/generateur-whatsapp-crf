"use client";

import { useEffect, useState } from "react";
import { styles } from "../../components/styles";

function nouveauFormulaire() {
  return { nom: "", materiel: "" };
}

export default function MoyensTable() {
  const [moyens, setMoyens] = useState([]);
  const [chargement, setChargement] = useState(true); // vrai jusqu'au premier fetch
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(nouveauFormulaire());

  useEffect(() => {
    fetch("/api/moyens")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setMoyens(data);
        setChargement(false);
      })
      .catch(() => {
        setErreur("Impossible de charger le catalogue de moyens.");
        setChargement(false);
      });
  }, []);

  async function enregistrer(moyen) {
    setErreur("");
    const res = await fetch("/api/moyens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moyen),
    });
    if (res.ok) {
      setMoyens(await res.json());
      return true;
    }
    const body = await res.json().catch(() => ({}));
    setErreur(body.message || "Impossible d'enregistrer le moyen.");
    return false;
  }

  async function creer(e) {
    e.preventDefault();
    if (!formulaire.nom.trim()) return;
    const ok = await enregistrer({
      id: crypto.randomUUID(),
      nom: formulaire.nom,
      materiel: formulaire.materiel,
    });
    if (ok) setFormulaire(nouveauFormulaire());
  }

  async function supprimer(moyen) {
    if (!confirm(`Supprimer le moyen "${moyen.nom}" ?`)) return;
    setErreur("");
    const res = await fetch("/api/moyens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: moyen.id }),
    });
    if (res.ok) {
      setMoyens(await res.json());
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible de supprimer ce moyen.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {erreur && (
        <div style={{ ...styles.previewBox, borderColor: "var(--rouge)" }}>{erreur}</div>
      )}

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Nouveau moyen (véhicule + matériel)</h2>
        <form onSubmit={creer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Véhicule</label>
            <input
              style={styles.input}
              placeholder="ex : VPSP 2"
              value={formulaire.nom}
              onChange={(e) => setFormulaire((f) => ({ ...f, nom: e.target.value }))}
              required
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Matériel associé (un lot par ligne)</label>
            <textarea
              style={{ ...styles.textarea, height: "72px" }}
              placeholder={"ex :\nLOT C PAPS"}
              value={formulaire.materiel}
              onChange={(e) => setFormulaire((f) => ({ ...f, materiel: e.target.value }))}
            />
          </div>
          <button type="submit" style={styles.btnSecondary}>
            Ajouter le moyen
          </button>
        </form>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Catalogue de moyens</h2>
        {chargement && <p>Chargement…</p>}
        {!chargement && moyens.length === 0 && <p>Aucun moyen enregistré.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {moyens.map((m) => (
            <MoyenRow key={m.id} moyen={m} onEnregistrer={enregistrer} onSupprimer={supprimer} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MoyenRow({ moyen, onEnregistrer, onSupprimer }) {
  const [nom, setNom] = useState(moyen.nom);
  const [materiel, setMateriel] = useState(moyen.materiel || "");

  const modifie = nom !== moyen.nom || materiel !== (moyen.materiel || "");

  return (
    <div style={styles.histItem}>
      <div style={styles.histTop}>
        <strong>{moyen.nom}</strong>
        <button style={styles.dangerLink} onClick={() => onSupprimer(moyen)}>
          Supprimer
        </button>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Véhicule</label>
        <input style={styles.input} value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Matériel associé (un lot par ligne)</label>
        <textarea
          style={{ ...styles.textarea, height: "60px" }}
          value={materiel}
          onChange={(e) => setMateriel(e.target.value)}
        />
      </div>
      {modifie && (
        <button
          style={styles.btnSecondary}
          onClick={() => onEnregistrer({ id: moyen.id, nom, materiel })}
          disabled={!nom.trim()}
        >
          Enregistrer les modifications
        </button>
      )}
    </div>
  );
}
