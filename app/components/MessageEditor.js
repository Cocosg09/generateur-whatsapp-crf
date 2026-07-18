import { styles } from "./styles";

export default function MessageEditor({
  message,
  desynchronise,
  copied,
  onChange,
  onResync,
  onCopier,
  onEnvoyer,
  onImprimer,
}) {
  return (
    <section style={styles.finalBox} className="print-area">
      <p style={styles.sectionLabel}>Message (édition en direct)</p>

      {desynchronise && (
        <div style={styles.syncBanner} className="no-print">
          <span>
            Vous avez modifié ce texte à la main — il ne se met plus à jour
            automatiquement avec le formulaire.
          </span>
          <button style={styles.linkBtn} onClick={onResync}>
            Resynchroniser
          </button>
        </div>
      )}

      <textarea
        style={styles.finalTextarea}
        className="no-print message-textarea"
        value={message}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="print-only print-header">
        <span className="print-mark" aria-hidden="true">
          ✚
        </span>
        <div>
          <h1>Générateur de message DPS — Croix-Rouge française</h1>
          <p>
            Édité le{" "}
            {new Date().toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <pre className="print-only message-print-body">{message}</pre>
      <p className="print-only print-footer">
        Généré via le générateur de message DPS — Croix-Rouge française
      </p>
      <div style={styles.actionsRow} className="no-print">
        <button style={styles.btnDark} onClick={onCopier}>
          {copied ? "Copié ✓" : "Copier le message"}
        </button>
        <button style={styles.btnWhatsapp} onClick={onEnvoyer}>
          Envoyer sur WhatsApp
        </button>
        <button style={styles.btnOutlinePrint} onClick={onImprimer}>
          Imprimer / Exporter en PDF
        </button>
      </div>
    </section>
  );
}
