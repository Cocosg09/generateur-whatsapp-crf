import { useEffect, useState } from "react";

/**
 * Charge le catalogue de moyens (véhicule + lot de matériel couplés, géré
 * côté admin) et permet d'appliquer un moyen à un poste : le champ véhicule
 * prend le nom du moyen et le champ matériel son lot associé.
 */
export function useMoyens({ setPostes }) {
  const [moyens, setMoyens] = useState([]);

  useEffect(() => {
    fetch("/api/moyens")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMoyens)
      .catch(() => setMoyens([]));
  }, []);

  function chargerMoyen(posteId, moyenId) {
    const m = moyens.find((x) => x.id === moyenId);
    if (!m) return;
    setPostes((prev) =>
      prev.map((p) =>
        p.id === posteId
          ? { ...p, vehicule: m.nom, materiel: m.materiel || "" }
          : p
      )
    );
  }

  return { moyens, chargerMoyen };
}
