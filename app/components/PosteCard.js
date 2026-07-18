import { ROLES_COURANTS } from "@/lib/dps";
import { styles } from "./styles";

export default function PosteCard({
  poste: p,
  index: posteIdx,
  total,
  modeles,
  moyens,
  preview,
  submitAttempted,
  onUpdatePoste,
  onUpdateIntervenant,
  onAddIntervenant,
  onRemoveIntervenant,
  onMove,
  onDuplicate,
  onRemove,
  onChargerModele,
  onChargerMoyen,
  onEnregistrerModele,
  onExtraire,
  onConfirmerExtraction,
  onAnnulerExtraction,
}) {
  function champStyle(valeur) {
    return submitAttempted && !valeur.trim()
      ? { ...styles.input, ...styles.inputInvalide }
      : styles.input;
  }

  return (
    <div style={styles.posteCard} className="no-print">
      <div style={styles.posteHeader}>
        <div style={styles.posteTitleWrap}>
          <span style={styles.badge}>{posteIdx + 1}</span>
          <span style={styles.posteTitle}>Poste {posteIdx + 1}</span>
        </div>
        <div style={styles.posteHeaderActions}>
          <button
            style={styles.arrowBtn}
            className="arrow-btn"
            disabled={posteIdx === 0}
            onClick={() => onMove(p.id, -1)}
            aria-label="Monter ce poste"
          >
            ↑
          </button>
          <button
            style={styles.arrowBtn}
            className="arrow-btn"
            disabled={posteIdx === total - 1}
            onClick={() => onMove(p.id, 1)}
            aria-label="Descendre ce poste"
          >
            ↓
          </button>
          <button style={styles.btnSecondary} onClick={() => onDuplicate(p.id)}>
            Dupliquer
          </button>
          {total > 1 && (
            <button style={styles.dangerLink} onClick={() => onRemove(p.id)}>
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
            if (e.target.value) onChargerModele(p.id, e.target.value);
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
        <button style={styles.btnSecondary} onClick={() => onEnregistrerModele(p)}>
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
          onChange={(e) => onUpdatePoste(p.id, "texteCollé", e.target.value)}
          placeholder={"Qualifications\tIntervenants\tHoraires\n..."}
        />
        <button
          style={{ ...styles.btnSecondary, marginTop: "4px" }}
          onClick={() => onExtraire(p.id)}
        >
          Extraire les intervenants
        </button>

        {preview && (
          <div style={styles.previewBox}>
            <p style={styles.sectionLabel}>Aperçu de l&apos;extraction — à confirmer</p>
            <p style={{ fontSize: "13px" }}>
              <strong>Poste :</strong> {preview.poste || "(non détecté)"}
            </p>
            <p style={{ fontSize: "13px" }}>
              <strong>Horaires :</strong> {preview.horaires || "(non détectés)"}
            </p>
            <ul style={{ fontSize: "13px", margin: 0, paddingLeft: "18px" }}>
              {preview.intervenants.map((i, idx) => (
                <li key={idx}>
                  {i.role} — {i.nom}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <button style={styles.btnSecondary} onClick={() => onConfirmerExtraction(p.id)}>
                Confirmer
              </button>
              <button
                style={{ ...styles.linkBtn, color: "var(--muted)" }}
                onClick={() => onAnnulerExtraction(p.id)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.grid2} className="poste-fields-grid">
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Nom du poste <span style={styles.required}>*</span>
          </label>
          <input
            style={champStyle(p.poste)}
            placeholder="ex : 14 Juillet - PAPS"
            value={p.poste}
            onChange={(e) => onUpdatePoste(p.id, "poste", e.target.value)}
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
            onChange={(e) => onUpdatePoste(p.id, "horaires", e.target.value)}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Heure de RDV</label>
          <input
            style={styles.input}
            placeholder="ex : 11h30"
            value={p.heureRdv}
            onChange={(e) => onUpdatePoste(p.id, "heureRdv", e.target.value)}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Lieu de RDV</label>
          <input
            style={styles.input}
            placeholder="ex : Nouveau PÔLE"
            value={p.lieuRdv}
            onChange={(e) => onUpdatePoste(p.id, "lieuRdv", e.target.value)}
          />
        </div>
        <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
          <label style={styles.label}>
            Lieu du poste (adresse) <span style={styles.required}>*</span>
          </label>
          <input
            style={champStyle(p.lieuPoste)}
            value={p.lieuPoste}
            onChange={(e) => onUpdatePoste(p.id, "lieuPoste", e.target.value)}
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
            onChange={(e) => onUpdatePoste(p.id, "contacts", e.target.value)}
          />
        </div>
        <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
          <label style={styles.label}>
            Véhicule <span style={styles.required}>*</span>
          </label>
          {moyens.length > 0 && (
            <select
              style={{ ...styles.input, width: "auto", marginBottom: "6px" }}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onChargerMoyen(p.id, e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Choisir un moyen (remplit véhicule + matériel)…
              </option>
              {moyens.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          )}
          <input
            style={champStyle(p.vehicule)}
            placeholder="ex : Liaison RIFTER + sur place VPSP2"
            value={p.vehicule}
            onChange={(e) => onUpdatePoste(p.id, "vehicule", e.target.value)}
          />
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <p style={styles.sectionLabel}>Intervenants</p>
        {p.intervenants.map((i, idx) => (
          <div key={idx} style={styles.intervenantRow}>
            <div style={styles.intervenantMainLine} className="intervenant-main-line">
              <select
                style={{ ...styles.input, width: "170px", flexShrink: 0 }}
                className="role-select"
                value={i.role}
                onChange={(e) => onUpdateIntervenant(p.id, idx, "role", e.target.value)}
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
                onChange={(e) => onUpdateIntervenant(p.id, idx, "nom", e.target.value)}
              />
              {p.intervenants.length > 1 && (
                <button
                  style={styles.removeBtn}
                  className="remove-btn"
                  onClick={() => onRemoveIntervenant(p.id, idx)}
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
                  onUpdateIntervenant(p.id, idx, "conducteur", e.target.checked)
                }
              />
              Conducteur
              {i.conducteur && (
                <select
                  style={{ ...styles.input, width: "90px", padding: "4px 6px" }}
                  className="vehicule-select"
                  value={i.typeVehicule}
                  onChange={(e) =>
                    onUpdateIntervenant(p.id, idx, "typeVehicule", e.target.value)
                  }
                >
                  <option value="VL">VL</option>
                  <option value="VPSP">VPSP</option>
                </select>
              )}
            </label>
          </div>
        ))}
        <button style={styles.addLink} onClick={() => onAddIntervenant(p.id)}>
          + Ajouter un intervenant
        </button>
      </div>

      <div style={styles.fieldGroup}>
        <p style={styles.sectionLabel}>Matériel à apporter</p>
        <textarea
          style={{ ...styles.textarea, height: "72px" }}
          placeholder={"Un lot par ligne, ex :\nLot O2\nLot PSE1\nDSA"}
          value={p.materiel}
          onChange={(e) => onUpdatePoste(p.id, "materiel", e.target.value)}
        />
      </div>
    </div>
  );
}
