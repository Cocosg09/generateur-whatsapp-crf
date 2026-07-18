"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  nouveauPoste,
  nouvelIntervenant,
  extraireDuTableauTexte,
  construireMessage,
  parserMessage,
} from "@/lib/dps";
import { styles } from "./components/styles";
import PosteCard from "./components/PosteCard";
import HistoriquePanel from "./components/HistoriquePanel";
import ModelesPanel from "./components/ModelesPanel";
import MessageEditor from "./components/MessageEditor";
import ImportOrdreMission from "./components/ImportOrdreMission";

const BROUILLON_KEY = "crf-postes-brouillon";

export default function Home() {
  const [postes, setPostes] = useState([nouveauPoste()]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [modeles, setModeles] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [afficherHistorique, setAfficherHistorique] = useState(false);
  const [afficherImportPdf, setAfficherImportPdf] = useState(false);
  const [preview, setPreview] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rechercheHistorique, setRechercheHistorique] = useState("");
  const [desynchronise, setDesynchronise] = useState(false);
  const [dernierApercuSynchronise, setDernierApercuSynchronise] = useState("");

  const dernierEnregistreRef = useRef("");
  const brouillonChargeRef = useRef(false);

  useEffect(() => {
    fetch("/api/modeles")
      .then((res) => (res.ok ? res.json() : []))
      .then(setModeles)
      .catch(() => setModeles([]));

    fetch("/api/historique")
      .then((res) => (res.ok ? res.json() : []))
      .then(setHistorique)
      .catch(() => setHistorique([]));

    try {
      const brouillon = localStorage.getItem(BROUILLON_KEY);
      if (brouillon) {
        const parsed = JSON.parse(brouillon);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Restauration ponctuelle depuis localStorage au montage : pas de
          // re-render en cascade, ce n'est pas le cas visé par la règle.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPostes(parsed);
        }
      }
    } catch {
      // brouillon illisible, on ignore
    }
    brouillonChargeRef.current = true;
  }, []);

  useEffect(() => {
    if (!brouillonChargeRef.current) return;
    try {
      localStorage.setItem(BROUILLON_KEY, JSON.stringify(postes));
    } catch {
      // stockage indisponible (mode privé, quota...), on ignore
    }
  }, [postes]);

  async function enregistrerModele(p) {
    const nom = prompt("Nom du modèle (ex: PAPS Pamiers)");
    if (!nom) return;

    const existant = modeles.find(
      (m) => m.nom.trim().toLowerCase() === nom.trim().toLowerCase()
    );
    if (
      existant &&
      !confirm(`Un modèle "${existant.nom}" existe déjà. Le mettre à jour ?`)
    ) {
      return;
    }

    const nouveauModele = {
      id: existant ? existant.id : crypto.randomUUID(),
      nom,
      heureRdv: p.heureRdv,
      lieuRdv: p.lieuRdv,
      lieuPoste: p.lieuPoste,
      contacts: p.contacts,
      vehicule: p.vehicule,
    };
    const res = await fetch("/api/modeles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nouveauModele),
    });
    if (res.ok) {
      setModeles(await res.json());
    } else {
      alert("Impossible d'enregistrer le modèle, réessayez plus tard.");
    }
  }

  function chargerModele(posteId, modeleId) {
    const m = modeles.find((x) => x.id === modeleId);
    if (!m) return;
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? {
              ...p,
              heureRdv: m.heureRdv,
              lieuRdv: m.lieuRdv,
              lieuPoste: m.lieuPoste,
              contacts: m.contacts,
              vehicule: m.vehicule,
            }
          : p
      )
    );
  }

  async function supprimerModele(modeleId) {
    if (!confirm("Supprimer ce modèle ?")) return;
    const res = await fetch("/api/modeles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modeleId }),
    });
    if (res.ok) {
      setModeles(await res.json());
    } else {
      alert("Impossible de supprimer le modèle, réessayez plus tard.");
    }
  }

  function updatePoste(id, field, value) {
    setPostes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function ajouterPoste() {
    setPostes((prev) => [...prev, nouveauPoste()]);
  }

  function dupliquerPoste(posteId) {
    setPostes((prev) => {
      const idx = prev.findIndex((p) => p.id === posteId);
      if (idx === -1) return prev;
      const copie = {
        ...prev[idx],
        id: crypto.randomUUID(),
        poste: prev[idx].poste ? `${prev[idx].poste} (copie)` : "",
        intervenants: prev[idx].intervenants.map((i) => ({ ...i })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copie);
      return next;
    });
  }

  function deplacerPoste(posteId, direction) {
    setPostes((prev) => {
      const idx = prev.findIndex((p) => p.id === posteId);
      const cible = idx + direction;
      if (idx === -1 || cible < 0 || cible >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[cible]] = [next[cible], next[idx]];
      return next;
    });
  }

  function reinitialiser() {
    if (
      confirm(
        "Réinitialiser le formulaire ? Toutes les données saisies seront perdues."
      )
    ) {
      setPostes([nouveauPoste()]);
      setMessage("");
      setCopied(false);
      setSubmitAttempted(false);
      setPreview({});
      setDesynchronise(false);
      try {
        localStorage.removeItem(BROUILLON_KEY);
      } catch {
        // stockage indisponible, on ignore
      }
    }
  }

  function supprimerPoste(id) {
    setPostes((prev) => prev.filter((p) => p.id !== id));
  }

  function updateIntervenant(posteId, index, field, value) {
    setPostes((prev) =>
      prev.map((p) => {
        if (p.id !== posteId) return p;
        const next = [...p.intervenants];
        next[index] = { ...next[index], [field]: value };
        return { ...p, intervenants: next };
      })
    );
  }

  function addIntervenant(posteId) {
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? { ...p, intervenants: [...p.intervenants, nouvelIntervenant()] }
          : p
      )
    );
  }

  function removeIntervenant(posteId, index) {
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? { ...p, intervenants: p.intervenants.filter((_, i) => i !== index) }
          : p
      )
    );
  }

  function importerPostesDepuisOrdreMission(postesDetectes) {
    const nouveaux = postesDetectes.map((p) => ({
      ...nouveauPoste(),
      poste: p.poste || "",
      horaires: p.horaires || "",
      lieuPoste: p.lieuPoste || "",
      contacts: p.contacts || "",
      intervenants:
        p.intervenants.length > 0
          ? p.intervenants.map((i) => ({ ...i }))
          : [nouvelIntervenant()],
    }));
    setPostes((prev) => {
      const posteInitialVide =
        prev.length === 1 &&
        !prev[0].poste.trim() &&
        !prev[0].horaires.trim() &&
        !prev[0].lieuPoste.trim() &&
        !prev[0].contacts.trim() &&
        prev[0].intervenants.every((i) => !i.nom.trim());
      return posteInitialVide ? nouveaux : [...prev, ...nouveaux];
    });
  }

  function extraireDuTableau(posteId) {
    const poste = postes.find((p) => p.id === posteId);
    if (!poste) return;
    const resultat = extraireDuTableauTexte(poste.texteCollé);
    setPreview((prev) => ({ ...prev, [posteId]: resultat }));
  }

  function confirmerExtraction(posteId) {
    const p = preview[posteId];
    if (!p) return;
    setPostes((prev) =>
      prev.map((x) =>
        x.id === posteId
          ? {
              ...x,
              poste: p.poste || x.poste,
              horaires: p.horaires || x.horaires,
              intervenants: p.intervenants.length > 0 ? p.intervenants : x.intervenants,
            }
          : x
      )
    );
    setPreview((prev) => {
      const next = { ...prev };
      delete next[posteId];
      return next;
    });
  }

  function annulerExtraction(posteId) {
    setPreview((prev) => {
      const next = { ...prev };
      delete next[posteId];
      return next;
    });
  }

  const apercu = useMemo(() => construireMessage(postes), [postes]);

  // Synchronise le message avec le formulaire pendant le rendu (plutôt que
  // dans un effet, cf. https://react.dev/learn/you-might-not-need-an-effect),
  // sauf si l'utilisateur a modifié le texte à la main (cf. onChange du
  // textarea, qui positionne `desynchronise`).
  if (apercu !== dernierApercuSynchronise) {
    setDernierApercuSynchronise(apercu);
    if (!desynchronise) {
      setMessage(apercu);
    }
  }

  function resynchroniser() {
    setMessage(apercu);
    setDesynchronise(false);
  }

  async function sauvegarderDansHistoriqueSiNecessaire() {
    if (message === dernierEnregistreRef.current) return;
    dernierEnregistreRef.current = message;
    const entree = {
      id: crypto.randomUUID(),
      texte: message,
      date: new Date().toISOString(),
    };
    const res = await fetch("/api/historique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entree),
    });
    if (res.ok) {
      setHistorique(await res.json());
    }
  }

  async function supprimerDeLHistorique(id) {
    if (!confirm("Supprimer ce message de l'historique ?")) return;
    const res = await fetch("/api/historique", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setHistorique(await res.json());
    } else {
      alert("Impossible de supprimer ce message, réessayez plus tard.");
    }
  }

  function copierDepuisHistorique(texte) {
    navigator.clipboard.writeText(texte);
    alert("Message copié !");
  }

  function chargerDepuisHistorique(texte) {
    if (
      !confirm("Remplacer le formulaire actuel par ce message de l'historique ?")
    )
      return;

    setPostes(parserMessage(texte));
    setDesynchronise(false);
    setSubmitAttempted(false);
    setAfficherHistorique(false);
  }

  function copierMessage() {
    setSubmitAttempted(true);
    navigator.clipboard.writeText(message);
    setCopied(true);
    sauvegarderDansHistoriqueSiNecessaire();
  }

  function envoyerWhatsApp() {
    setSubmitAttempted(true);
    const texteEncode = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${texteEncode}`, "_blank");
    sauvegarderDansHistoriqueSiNecessaire();
  }

  function imprimer() {
    setSubmitAttempted(true);
    sauvegarderDansHistoriqueSiNecessaire();
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
          <button
            style={styles.ghostBtn}
            onClick={() => setAfficherHistorique(!afficherHistorique)}
          >
            Historique
          </button>
          <button style={styles.ghostBtn} onClick={reinitialiser}>
            Réinitialiser
          </button>
        </div>
      </header>

      {afficherImportPdf && (
        <ImportOrdreMission
          onConfirmer={importerPostesDepuisOrdreMission}
          onClose={() => setAfficherImportPdf(false)}
        />
      )}

      <main style={styles.main} className="dps-layout">
        <div className="form-column">
          {afficherHistorique && (
            <HistoriquePanel
              historique={historique}
              recherche={rechercheHistorique}
              onRechercheChange={setRechercheHistorique}
              onCharger={chargerDepuisHistorique}
              onCopier={copierDepuisHistorique}
              onSupprimer={supprimerDeLHistorique}
            />
          )}

          {postes.map((p, posteIdx) => (
            <PosteCard
              key={p.id}
              poste={p}
              index={posteIdx}
              total={postes.length}
              modeles={modeles}
              preview={preview[p.id]}
              submitAttempted={submitAttempted}
              onUpdatePoste={updatePoste}
              onUpdateIntervenant={updateIntervenant}
              onAddIntervenant={addIntervenant}
              onRemoveIntervenant={removeIntervenant}
              onMove={deplacerPoste}
              onDuplicate={dupliquerPoste}
              onRemove={supprimerPoste}
              onChargerModele={chargerModele}
              onEnregistrerModele={enregistrerModele}
              onExtraire={extraireDuTableau}
              onConfirmerExtraction={confirmerExtraction}
              onAnnulerExtraction={annulerExtraction}
            />
          ))}

          <button style={styles.btnDashed} className="no-print" onClick={ajouterPoste}>
            + Ajouter un autre poste (ex : poste fixe en plus du PAPS)
          </button>

          <ModelesPanel modeles={modeles} onSupprimer={supprimerModele} />
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
