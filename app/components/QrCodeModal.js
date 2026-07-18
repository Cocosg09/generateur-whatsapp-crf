"use client";

import { useEffect, useRef, useState } from "react";
import { styles } from "./styles";

export default function QrCodeModal({ url, onClose }) {
  const canvasRef = useRef(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    let annule = false;
    import("qrcode").then((QRCode) => {
      if (annule || !canvasRef.current) return;
      QRCode.toCanvas(
        canvasRef.current,
        url,
        { errorCorrectionLevel: "L", width: 280, margin: 2 },
        (err) => {
          if (annule) return;
          setErreur(
            err
              ? "Le message est trop long pour être encodé dans un QR code. Raccourcissez-le ou utilisez le bouton « Envoyer sur WhatsApp »."
              : ""
          );
        }
      );
    });
    return () => {
      annule = true;
    };
  }, [url]);

  return (
    <div
      style={styles.modalOverlay}
      className="no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={styles.modalBox} role="dialog" aria-modal="true" aria-label="QR code WhatsApp">
        <div style={styles.modalHeader}>
          <p style={styles.modalTitle}>Scanner pour ouvrir WhatsApp</p>
          <button style={styles.modalCloseBtn} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          Scannez ce code avec l&apos;appareil photo d&apos;un téléphone : WhatsApp
          s&apos;ouvre avec le message déjà prêt, il ne reste qu&apos;à choisir le
          contact ou le groupe et à l&apos;envoyer.
        </p>

        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <canvas ref={canvasRef} />
        </div>

        {erreur && <p style={{ fontSize: "13px", color: "var(--rouge)" }}>{erreur}</p>}
      </div>
    </div>
  );
}
