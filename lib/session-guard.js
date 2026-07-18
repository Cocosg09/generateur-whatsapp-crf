import { verifierSession } from "./auth-edge";

// Ré-authentifie une requête indépendamment des en-têtes posés par le
// middleware (x-user/x-role) : les routes admin ne doivent pas se fier à des
// en-têtes qui pourraient en théorie être falsifiés en amont, elles
// revérifient elles-mêmes le cookie de session signé.
export async function getSessionUtilisateur(request) {
  const cookie = request.cookies.get("session");
  return verifierSession(cookie?.value);
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
