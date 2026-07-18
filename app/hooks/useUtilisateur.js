import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Récupère l'utilisateur courant (`/api/me`), en dérive les autorisations par
 * fonctionnalité et expose la déconnexion. Avant que `/api/me` ne réponde
 * (`moi` null), les fonctionnalités sont considérées comme autorisées pour
 * éviter un flash de contenu masqué ; les routes API restent la source de
 * vérité côté serveur.
 */
export function useUtilisateur() {
  const router = useRouter();
  const [moi, setMoi] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMoi)
      .catch(() => setMoi(null));
  }, []);

  const peutHistorique = !moi || moi.role === "admin" || moi.permissions?.historique;

  async function seDeconnecter() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return { moi, peutHistorique, seDeconnecter };
}
