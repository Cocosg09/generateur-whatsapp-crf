import { useEffect, useRef, useState } from "react";
import { serialiserPostes } from "@/lib/dps";

/**
 * Gère l'historique des messages générés : chargement initial, enregistrement
 * (avec les données structurées du formulaire) sans doublon consécutif,
 * suppression, copie, ainsi que l'état de la recherche et de l'affichage du
 * panneau.
 */
export function useHistorique() {
  const [historique, setHistorique] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [afficher, setAfficher] = useState(false);
  const dernierEnregistreRef = useRef("");

  useEffect(() => {
    fetch("/api/historique")
      .then((res) => (res.ok ? res.json() : []))
      .then(setHistorique)
      .catch(() => setHistorique([]));
  }, []);

  async function enregistrerSiNecessaire({ texte, postes }) {
    if (texte === dernierEnregistreRef.current) return;
    dernierEnregistreRef.current = texte;
    const entree = {
      id: crypto.randomUUID(),
      texte,
      date: new Date().toISOString(),
      postes: serialiserPostes(postes),
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

  async function supprimer(id) {
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

  function copier(texte) {
    navigator.clipboard.writeText(texte);
    alert("Message copié !");
  }

  return {
    historique,
    recherche,
    setRecherche,
    afficher,
    setAfficher,
    enregistrerSiNecessaire,
    supprimer,
    copier,
  };
}
