import { useEffect, useRef, useState } from "react";
import { ROLES_COURANTS, AVANCE_RDV_MINUTES_PAR_DEFAUT, calculerHeureRdv } from "@/lib/dps";
import { styles } from "./styles";

// Ferme un panneau (menu, autocomplete) au clic en dehors de son conteneur,
// tant qu'il est ouvert.
function useFermetureExterieure(actif, fermer) {
  const ref = useRef(null);
  useEffect(() => {
    if (!actif) return;
    function onClicExterieur(e) {
      if (ref.current && !ref.current.contains(e.target)) fermer();
    }
    document.addEventListener("mousedown", onClicExterieur);
    return () => document.removeEventListener("mousedown", onClicExterieur);
  }, [actif, fermer]);
  return ref;
}

// Champ texte libre avec suggestions (gérées depuis /admin) façon barre de
// recherche : au clic, toutes les valeurs s'affichent ; la saisie réduit la
// liste aux valeurs correspondantes. `onChoisir` (par défaut `onChange`) est
// appelé quand une suggestion est cliquée ou validée au clavier.
function ChampAutocomplete({ valeur, options, style, placeholder, onChange, onChoisir }) {
  const [ouvert, setOuvert] = useState(false);
  const [surligne, setSurligne] = useState(-1);
  const conteneurRef = useFermetureExterieure(ouvert, () => setOuvert(false));

  const suggestions = ouvert
    ? (options || []).filter((o) => o.toLowerCase().includes(valeur.trim().toLowerCase()))
    : [];

  function choisir(v) {
    (onChoisir || onChange)(v);
    setOuvert(false);
    setSurligne(-1);
  }

  return (
    <div style={styles.autocompleteWrap} ref={conteneurRef}>
      <input
        style={style}
        placeholder={placeholder}
        value={valeur}
        onFocus={() => setOuvert(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOuvert(true);
          setSurligne(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOuvert(false);
          else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSurligne((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSurligne((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && surligne >= 0 && suggestions[surligne]) {
            e.preventDefault();
            choisir(suggestions[surligne]);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul style={styles.autocompleteList}>
          {suggestions.map((s, idx) => (
            <li
              key={s}
              style={{
                ...styles.autocompleteItem,
                ...(idx === surligne ? styles.autocompleteItemActive : {}),
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                choisir(s);
              }}
              onMouseEnter={() => setSurligne(idx)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Menu compact (déclenché par une icône) regroupant les deux façons de
// calculer une heure de RDV suggérée : manuellement via une avance en
// minutes, ou depuis le temps de trajet réel jusqu'au lieu du poste.
function MenuRdvAuto({
  avance,
  onAvanceChange,
  heureCalculee,
  onAppliquerHeure,
  onCalculerTrajet,
  chargementTrajet,
  trajetDisponible,
  erreurTrajet,
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useFermetureExterieure(ouvert, () => setOuvert(false));

  return (
    <div style={styles.menuWrap} ref={ref}>
      <button
        type="button"
        style={styles.menuTrigger}
        onClick={() => setOuvert((v) => !v)}
        aria-label="Calculer automatiquement l'heure de RDV"
        title="Calculer automatiquement l'heure de RDV"
      >
        ⏱
      </button>
      {ouvert && (
        <div style={styles.menuPanel}>
          <p style={styles.menuPanelTitle}>Heure de RDV automatique</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="number"
              min="0"
              step="5"
              style={{ ...styles.input, width: "60px", padding: "4px 6px" }}
              value={avance}
              onChange={(e) => onAvanceChange(e.target.value)}
              aria-label="Avance en minutes avant le début du poste"
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>min avant le début</span>
          </div>
          <button
            type="button"
            style={styles.btnSecondary}
            disabled={!heureCalculee}
            onClick={() => {
              onAppliquerHeure(heureCalculee);
              setOuvert(false);
            }}
          >
            Appliquer{heureCalculee ? ` : ${heureCalculee}` : ""}
          </button>
          <div style={styles.menuDivider} />
          <button
            type="button"
            style={styles.btnSecondary}
            disabled={!trajetDisponible || chargementTrajet}
            onClick={onCalculerTrajet}
          >
            {chargementTrajet ? "Calcul du trajet…" : "Calculer depuis le trajet (Pamiers)"}
          </button>
          {erreurTrajet && (
            <p style={{ fontSize: "12px", color: "var(--rouge)", margin: 0 }}>{erreurTrajet}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PosteCard({
  poste: p,
  index: posteIdx,
  total,
  listes,
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
  onChargerMoyen,
  onExtraire,
  onConfirmerExtraction,
  onAnnulerExtraction,
}) {
  const [avanceRdv, setAvanceRdv] = useState(AVANCE_RDV_MINUTES_PAR_DEFAUT);
  const [chargementTrajet, setChargementTrajet] = useState(false);
  const [erreurTrajet, setErreurTrajet] = useState("");
  const heureRdvCalculee = calculerHeureRdv(p.horaires, Number(avanceRdv) || 0);

  function champStyle(valeur) {
    return submitAttempted && !valeur.trim()
      ? { ...styles.input, ...styles.inputInvalide }
      : styles.input;
  }

  async function calculerTrajet() {
    if (!p.lieuPoste.trim()) return;
    setErreurTrajet("");
    setChargementTrajet(true);
    try {
      const res = await fetch("/api/trajet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adresse: p.lieuPoste }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreurTrajet(body.message || "Impossible de calculer le trajet.");
        return;
      }
      setAvanceRdv(body.minutes);
      const heure = calculerHeureRdv(p.horaires, body.minutes);
      if (heure) onUpdatePoste(p.id, "heureRdv", heure);
    } catch {
      setErreurTrajet("Impossible de calculer le trajet, réessayez plus tard.");
    } finally {
      setChargementTrajet(false);
    }
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={styles.label}>Heure de RDV</label>
            <MenuRdvAuto
              avance={avanceRdv}
              onAvanceChange={setAvanceRdv}
              heureCalculee={heureRdvCalculee}
              onAppliquerHeure={(h) => onUpdatePoste(p.id, "heureRdv", h)}
              onCalculerTrajet={calculerTrajet}
              chargementTrajet={chargementTrajet}
              trajetDisponible={!!p.lieuPoste.trim()}
              erreurTrajet={erreurTrajet}
            />
          </div>
          <ChampAutocomplete
            style={styles.input}
            placeholder="ex : 11h30"
            valeur={p.heureRdv}
            options={listes.heureRdv}
            onChange={(v) => onUpdatePoste(p.id, "heureRdv", v)}
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Lieu de RDV</label>
          <ChampAutocomplete
            style={styles.input}
            placeholder="ex : Nouveau PÔLE"
            valeur={p.lieuRdv}
            options={listes.lieuRdv}
            onChange={(v) => onUpdatePoste(p.id, "lieuRdv", v)}
          />
        </div>
        <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
          <label style={styles.label}>
            Lieu du poste (adresse) <span style={styles.required}>*</span>
          </label>
          <ChampAutocomplete
            style={champStyle(p.lieuPoste)}
            valeur={p.lieuPoste}
            options={listes.lieuPoste}
            onChange={(v) => onUpdatePoste(p.id, "lieuPoste", v)}
          />
        </div>
        <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
          <label style={styles.label}>
            Contact(s) sur place <span style={styles.required}>*</span>
          </label>
          <ChampAutocomplete
            style={champStyle(p.contacts)}
            placeholder="Nom (06...) et Nom (06...)"
            valeur={p.contacts}
            options={listes.contacts}
            onChange={(v) => onUpdatePoste(p.id, "contacts", v)}
          />
        </div>
        <div style={{ ...styles.fieldGroup, ...styles.fullSpan }}>
          <label style={styles.label}>
            Véhicule <span style={styles.required}>*</span>
          </label>
          <ChampAutocomplete
            style={champStyle(p.vehicule)}
            placeholder="ex : Liaison RIFTER + sur place VPSP2"
            valeur={p.vehicule}
            options={moyens.map((m) => m.nom)}
            onChange={(v) => onUpdatePoste(p.id, "vehicule", v)}
            onChoisir={(nom) => {
              const moyenCorrespondant = moyens.find((m) => m.nom === nom);
              if (moyenCorrespondant) {
                onChargerMoyen(p.id, moyenCorrespondant.id);
              } else {
                onUpdatePoste(p.id, "vehicule", nom);
              }
            }}
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
