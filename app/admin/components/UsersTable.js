"use client";

import { useEffect, useState } from "react";
import { styles } from "../../components/styles";

const FONCTIONNALITES = [
  { cle: "postes", label: "Postes / message" },
  { cle: "historique", label: "Historique" },
];

function nouveauFormulaire() {
  return {
    username: "",
    password: "",
    role: "user",
    permissions: { postes: true, historique: true },
  };
}

export default function UsersTable() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(nouveauFormulaire());

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  async function chargerUtilisateurs() {
    setChargement(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setUtilisateurs(await res.json());
    } else {
      setErreur("Impossible de charger la liste des utilisateurs.");
    }
    setChargement(false);
  }

  async function creerUtilisateur(e) {
    e.preventDefault();
    setErreur("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulaire),
    });
    if (res.ok) {
      setFormulaire(nouveauFormulaire());
      chargerUtilisateurs();
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible de créer l'utilisateur.");
    }
  }

  async function modifier(username, patch) {
    setErreur("");
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      chargerUtilisateurs();
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible de modifier cet utilisateur.");
    }
  }

  async function supprimer(username) {
    if (!confirm(`Supprimer le compte "${username}" ?`)) return;
    setErreur("");
    const res = await fetch(`/api/admin/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      chargerUtilisateurs();
    } else {
      const body = await res.json().catch(() => ({}));
      setErreur(body.message || "Impossible de supprimer cet utilisateur.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {erreur && (
        <div style={{ ...styles.previewBox, borderColor: "var(--rouge)" }}>{erreur}</div>
      )}

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Nouvel utilisateur</h2>
        <form onSubmit={creerUtilisateur} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Identifiant</label>
              <input
                style={styles.input}
                value={formulaire.username}
                onChange={(e) => setFormulaire((f) => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mot de passe (min. 8 caractères)</label>
              <input
                type="password"
                style={styles.input}
                value={formulaire.password}
                onChange={(e) => setFormulaire((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Rôle</label>
            <select
              style={{ ...styles.input, width: "auto" }}
              value={formulaire.role}
              onChange={(e) => setFormulaire((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {formulaire.role === "user" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Accès aux fonctionnalités</label>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                {FONCTIONNALITES.map((f) => (
                  <label key={f.cle} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="checkbox"
                      checked={formulaire.permissions[f.cle]}
                      onChange={(e) =>
                        setFormulaire((prev) => ({
                          ...prev,
                          permissions: { ...prev.permissions, [f.cle]: e.target.checked },
                        }))
                      }
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit" style={styles.btnSecondary}>
            Créer le compte
          </button>
        </form>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Comptes existants</h2>
        {chargement && <p>Chargement…</p>}
        {!chargement && utilisateurs.length === 0 && <p>Aucun utilisateur.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {utilisateurs.map((u) => (
            <div key={u.username} style={styles.histItem}>
              <div style={styles.histTop}>
                <strong>
                  {u.username}
                  {u.disabled ? " (désactivé)" : ""}
                </strong>
                <button style={styles.dangerLink} onClick={() => supprimer(u.username)}>
                  Supprimer
                </button>
              </div>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  Rôle :
                  <select
                    style={{ ...styles.input, width: "auto" }}
                    value={u.role}
                    onChange={(e) => modifier(u.username, { role: e.target.value })}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </label>

                <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="checkbox"
                    checked={!!u.disabled}
                    onChange={(e) => modifier(u.username, { disabled: e.target.checked })}
                  />
                  Compte désactivé
                </label>
              </div>

              {u.role === "user" && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {FONCTIONNALITES.map((f) => (
                    <label key={f.cle} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={!!u.permissions?.[f.cle]}
                        onChange={(e) =>
                          modifier(u.username, {
                            permissions: { ...u.permissions, [f.cle]: e.target.checked },
                          })
                        }
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
