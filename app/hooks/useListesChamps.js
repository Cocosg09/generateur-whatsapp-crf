import { useEffect, useState } from "react";

/**
 * Charge le catalogue de suggestions par champ (heure de RDV, lieu de RDV,
 * lieu du poste, contacts), géré côté admin : chaque champ garde un simple
 * champ texte libre, ces listes ne servent qu'à proposer des valeurs
 * fréquentes via un menu déroulant.
 */
export function useListesChamps() {
  const [listes, setListes] = useState({});

  useEffect(() => {
    fetch("/api/listes-champs")
      .then((res) => (res.ok ? res.json() : {}))
      .then(setListes)
      .catch(() => setListes({}));
  }, []);

  return { listes };
}
