import { useEffect, useState } from "react";

/**
 * Gère les modèles réutilisables de poste (infos récurrentes : RDV, lieu,
 * contacts, véhicule) : chargement initial, enregistrement/mise à jour par
 * nom, rechargement dans un poste et suppression.
 */
export function useModeles({ setPostes }) {
  const [modeles, setModeles] = useState([]);

  useEffect(() => {
    fetch("/api/modeles")
      .then((res) => (res.ok ? res.json() : []))
      .then(setModeles)
      .catch(() => setModeles([]));
  }, []);

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

  return { modeles, enregistrerModele, chargerModele, supprimerModele };
}
