import { styles } from "./styles";

export default function ModelesPanel({ modeles, onSupprimer }) {
  if (modeles.length === 0) return null;

  return (
    <section style={styles.panel} className="no-print">
      <p style={styles.panelTitle}>Modèles enregistrés</p>
      {modeles.map((m) => (
        <div key={m.id} style={styles.modeleRow}>
          <span>{m.nom}</span>
          <button
            style={{ ...styles.linkBtn, color: "var(--rouge)" }}
            onClick={() => onSupprimer(m.id)}
          >
            Supprimer
          </button>
        </div>
      ))}
    </section>
  );
}
