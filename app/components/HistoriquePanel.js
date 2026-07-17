import { formaterDate } from "@/lib/dps";
import { styles } from "./styles";

export default function HistoriquePanel({
  historique,
  recherche,
  onRechercheChange,
  onCharger,
  onCopier,
  onSupprimer,
}) {
  const historiqueFiltre = !recherche.trim()
    ? historique
    : historique.filter((h) => {
        const q = recherche.toLowerCase();
        return (
          h.texte.toLowerCase().includes(q) ||
          formaterDate(h.date).toLowerCase().includes(q)
        );
      });

  return (
    <section style={styles.panel} className="no-print">
      <p style={styles.panelTitle}>Historique des messages générés</p>
      <input
        style={styles.searchInput}
        placeholder="Rechercher par texte ou date..."
        value={recherche}
        onChange={(e) => onRechercheChange(e.target.value)}
      />
      {historiqueFiltre.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>Aucun message trouvé.</p>
      )}
      {historiqueFiltre.map((h) => (
        <div key={h.id} style={styles.histItem}>
          <div style={styles.histTop}>
            <span style={styles.histDate}>{formaterDate(h.date)}</span>
            <div style={styles.histActions}>
              <button
                style={{ ...styles.linkBtn, color: "var(--rouge)" }}
                onClick={() => onCharger(h.texte)}
              >
                Charger dans le formulaire
              </button>
              <button
                style={{ ...styles.linkBtn, color: "var(--encre)" }}
                onClick={() => onCopier(h.texte)}
              >
                Copier
              </button>
              <button
                style={{ ...styles.linkBtn, color: "var(--muted)" }}
                onClick={() => onSupprimer(h.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
          <pre style={{ ...styles.apercuBox, fontSize: "12px" }}>{h.texte}</pre>
        </div>
      ))}
    </section>
  );
}
