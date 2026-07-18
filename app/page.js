"use client";

import { useState } from "react";
import Link from "next/link";
import { construireMessage, parserMessage, restaurerPostes } from "@/lib/dps";
import { styles } from "./components/styles";
import PosteCard from "./components/PosteCard";
import HistoriquePanel from "./components/HistoriquePanel";
import MessageEditor from "./components/MessageEditor";
import ImportOrdreMission from "./components/ImportOrdreMission";
import { useBrouillon } from "./hooks/useBrouillon";
import { usePostes } from "./hooks/usePostes";
import { useListesChamps } from "./hooks/useListesChamps";
import { useMoyens } from "./hooks/useMoyens";
import { useHistorique } from "./hooks/useHistorique";
import { useMessage } from "./hooks/useMessage";
import { useUtilisateur } from "./hooks/useUtilisateur";

export default function Home() {
  const { postes, setPostes, effacerBrouillon } = useBrouillon();
  const postesActions = usePostes({ postes, setPostes });
  const { listes } = useListesChamps();
  const moyens = useMoyens({ setPostes });
  const historique = useHistorique();
  const { message, setMessage, desynchronise, setDesynchronise, resynchroniser } =
    useMessage(postes);
  const { moi, peutHistorique, seDeconnecter } = useUtilisateur();

  const [copied, setCopied] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [afficherImportPdf, setAfficherImportPdf] = useState(false);

  function reinitialiser() {
    if (
      confirm(
        "Réinitialiser le formulaire ? Toutes les données saisies seront perdues."
      )
    ) {
      postesActions.reinitialiserPostes();
      setMessage("");
      setCopied(false);
      setSubmitAttempted(false);
      setDesynchronise(false);
      effacerBrouillon();
    }
  }

  function chargerDepuisHistorique(entree) {
    if (
      !confirm("Remplacer le formulaire actuel par ce message de l'historique ?")
    )
      return;

    // Les entrées récentes portent les données structurées du formulaire :
    // restauration exacte, sans repasser par le parsing regex du texte
    // (conservé pour les anciennes entrées, texte seul).
    const nouveauxPostes =
      restaurerPostes(entree.postes) || parserMessage(entree.texte);
    setPostes(nouveauxPostes);
    // Si le texte enregistré avait été retouché à la main, on le restaure
    // tel quel et on marque le message comme désynchronisé du formulaire.
    setMessage(entree.texte);
    setDesynchronise(construireMessage(nouveauxPostes) !== entree.texte);
    setSubmitAttempted(false);
    historique.setAfficher(false);
  }

  function copierMessage() {
    setSubmitAttempted(true);
    navigator.clipboard.writeText(message);
    setCopied(true);
    historique.enregistrerSiNecessaire({ texte: message, postes });
  }

  function envoyerWhatsApp() {
    setSubmitAttempted(true);
    const texteEncode = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${texteEncode}`, "_blank");
    historique.enregistrerSiNecessaire({ texte: message, postes });
  }

  function imprimer() {
    setSubmitAttempted(true);
    historique.enregistrerSiNecessaire({ texte: message, postes });
    window.print();
  }

  return (
    <div style={styles.page}>
      <header style={styles.header} className="no-print dps-header app-header">
        <div style={styles.headerTitle} className="header-title">
          <span aria-hidden="true">✚</span>
          Générateur de message DPS
        </div>
        <div style={styles.headerActions} className="header-actions">
          <button style={styles.ghostBtn} onClick={() => setAfficherImportPdf(true)}>
            Importer un PDF
          </button>
          {peutHistorique && (
            <button
              style={styles.ghostBtn}
              onClick={() => historique.setAfficher((v) => !v)}
            >
              Historique
            </button>
          )}
          <button style={styles.ghostBtn} onClick={reinitialiser}>
            Réinitialiser
          </button>
          {moi?.role === "admin" && (
            <Link style={styles.ghostBtn} href="/admin">
              Administration
            </Link>
          )}
          {moi && (
            <button style={styles.ghostBtn} onClick={seDeconnecter}>
              Déconnexion
            </button>
          )}
        </div>
      </header>

      {afficherImportPdf && (
        <ImportOrdreMission
          onConfirmer={postesActions.importerPostesDepuisOrdreMission}
          onClose={() => setAfficherImportPdf(false)}
        />
      )}

      <main style={styles.main} className="dps-layout">
        <div className="form-column">
          {peutHistorique && historique.afficher && (
            <HistoriquePanel
              historique={historique.historique}
              recherche={historique.recherche}
              onRechercheChange={historique.setRecherche}
              onCharger={chargerDepuisHistorique}
              onCopier={historique.copier}
              onSupprimer={historique.supprimer}
            />
          )}

          {postes.map((p, posteIdx) => (
            <PosteCard
              key={p.id}
              poste={p}
              index={posteIdx}
              total={postes.length}
              listes={listes}
              moyens={moyens.moyens}
              preview={postesActions.preview[p.id]}
              submitAttempted={submitAttempted}
              onUpdatePoste={postesActions.updatePoste}
              onUpdateIntervenant={postesActions.updateIntervenant}
              onAddIntervenant={postesActions.addIntervenant}
              onRemoveIntervenant={postesActions.removeIntervenant}
              onMove={postesActions.deplacerPoste}
              onDuplicate={postesActions.dupliquerPoste}
              onRemove={postesActions.supprimerPoste}
              onChargerMoyen={moyens.chargerMoyen}
              onExtraire={postesActions.extraireDuTableau}
              onConfirmerExtraction={postesActions.confirmerExtraction}
              onAnnulerExtraction={postesActions.annulerExtraction}
            />
          ))}

          <button style={styles.btnDashed} className="no-print" onClick={postesActions.ajouterPoste}>
            + Ajouter un autre poste (ex : poste fixe en plus du PAPS)
          </button>
        </div>

        <div className="message-column">
          <MessageEditor
            message={message}
            desynchronise={desynchronise}
            copied={copied}
            onChange={(value) => {
              setMessage(value);
              setCopied(false);
              setDesynchronise(true);
            }}
            onResync={resynchroniser}
            onCopier={copierMessage}
            onEnvoyer={envoyerWhatsApp}
            onImprimer={imprimer}
          />
        </div>
      </main>
    </div>
  );
}
