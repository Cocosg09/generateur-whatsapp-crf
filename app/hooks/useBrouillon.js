import { useEffect, useRef, useState } from "react";
import { nouveauPoste } from "@/lib/dps";

const BROUILLON_KEY = "crf-postes-brouillon";

/**
 * Détient l'état `postes` du formulaire et le sauvegarde dans le navigateur
 * (localStorage) pour éviter une perte de saisie en cas de rechargement
 * accidentel de la page. Restauré une fois au montage.
 */
export function useBrouillon() {
  const [postes, setPostes] = useState([nouveauPoste()]);
  const brouillonChargeRef = useRef(false);

  useEffect(() => {
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

  function effacerBrouillon() {
    try {
      localStorage.removeItem(BROUILLON_KEY);
    } catch {
      // stockage indisponible, on ignore
    }
  }

  return { postes, setPostes, effacerBrouillon };
}
