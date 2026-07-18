import { verifierSession } from "./auth-edge";
import { getUser } from "./users";

// Ré-authentifie une requête indépendamment des en-têtes posés par le
// middleware (x-user/x-role) : les routes admin ne doivent pas se fier à des
// en-têtes qui pourraient en théorie être falsifiés en amont, elles
// revérifient elles-mêmes le cookie de session signé.
//
// Vérifie aussi que le compte n'a pas été désactivé depuis l'émission du
// cookie : les autres informations du token (rôle, permissions) restent
// valables jusqu'à expiration ou reconnexion (cf. limitation documentée
// dans le README), mais la désactivation d'un compte doit couper l'accès
// immédiatement plutôt que d'attendre jusqu'à 7 jours.
export async function getSessionUtilisateur(request) {
  const cookie = request.cookies.get("session");
  const session = await verifierSession(cookie?.value);
  if (!session) return null;

  const utilisateur = await getUser(session.u);
  if (!utilisateur || utilisateur.disabled) return null;

  return session;
}

export async function requireAdmin(request) {
  const session = await getSessionUtilisateur(request);
  if (!session || session.r !== "admin") return null;
  return session;
}

// Vérifie l'accès à une fonctionnalité (historique/modeles/postes) : les
// admins ont toujours accès, les autres utilisateurs selon leur permission
// embarquée dans le cookie de session.
export async function requirePermission(request, fonctionnalite) {
  const session = await getSessionUtilisateur(request);
  if (!session) return null;
  if (session.r === "admin") return session;
  return session.p?.[fonctionnalite] ? session : null;
}
