import { useState } from "react";
import {
  nouveauPoste,
  nouvelIntervenant,
  extraireDuTableauTexte,
} from "@/lib/dps";

/**
 * Regroupe toutes les mutations sur la liste des postes (ajout, suppression,
 * duplication, réordonnancement, intervenants) ainsi que l'extraction depuis
 * un tableau collé (état `preview` à confirmer avant application) et l'import
 * d'un ordre de mission.
 *
 * L'état `postes` lui-même est détenu par `useBrouillon` et passé ici, afin
 * que la persistance locale reste centralisée.
 */
export function usePostes({ postes, setPostes }) {
  const [preview, setPreview] = useState({});

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

  function reinitialiserPostes() {
    setPostes([nouveauPoste()]);
    setPreview({});
  }

  return {
    preview,
    updatePoste,
    ajouterPoste,
    dupliquerPoste,
    deplacerPoste,
    supprimerPoste,
    updateIntervenant,
    addIntervenant,
    removeIntervenant,
    importerPostesDepuisOrdreMission,
    extraireDuTableau,
    confirmerExtraction,
    annulerExtraction,
    reinitialiserPostes,
  };
}
