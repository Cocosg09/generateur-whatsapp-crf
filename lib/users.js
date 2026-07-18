import Redis from "ioredis";

let redis;
export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Erreur Redis:", err));
  }
  return redis;
}

const CLE_INDEX = "users-index";
const CLE_UTILISATEUR = (username) => `user:${username}`;

export const PERMISSIONS_PAR_DEFAUT = { postes: true, historique: true };

export function normaliserUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

export async function getUser(username) {
  const r = getRedis();
  const data = await r.get(CLE_UTILISATEUR(normaliserUsername(username)));
  return data ? JSON.parse(data) : null;
}

export async function listUsers() {
  const r = getRedis();
  const data = await r.get(CLE_INDEX);
  const noms = data ? JSON.parse(data) : [];
  const utilisateurs = await Promise.all(noms.map((nom) => getUser(nom)));
  return utilisateurs.filter(Boolean);
}

async function ajouterAIndex(r, username) {
  const data = await r.get(CLE_INDEX);
  const noms = data ? JSON.parse(data) : [];
  if (!noms.includes(username)) {
    noms.push(username);
    await r.set(CLE_INDEX, JSON.stringify(noms));
  }
}

async function retirerDeLIndex(r, username) {
  const data = await r.get(CLE_INDEX);
  const noms = data ? JSON.parse(data) : [];
  await r.set(CLE_INDEX, JSON.stringify(noms.filter((n) => n !== username)));
}

export async function createUser({ username, passwordHash, role, permissions, createdBy }) {
  const nom = normaliserUsername(username);
  const r = getRedis();
  const existant = await getUser(nom);
  if (existant) {
    throw new Error("Ce nom d'utilisateur existe déjà.");
  }
  const utilisateur = {
    username: nom,
    passwordHash,
    role: role === "admin" ? "admin" : "user",
    permissions: { ...PERMISSIONS_PAR_DEFAUT, ...(permissions || {}) },
    createdAt: new Date().toISOString(),
    createdBy: createdBy || nom,
    disabled: false,
  };
  await r.set(CLE_UTILISATEUR(nom), JSON.stringify(utilisateur));
  await ajouterAIndex(r, nom);
  return utilisateur;
}

export async function updateUser(username, patch) {
  const nom = normaliserUsername(username);
  const r = getRedis();
  const existant = await getUser(nom);
  if (!existant) return null;
  const suivant = {
    ...existant,
    ...(patch.role !== undefined ? { role: patch.role === "admin" ? "admin" : "user" } : {}),
    ...(patch.permissions !== undefined
      ? { permissions: { ...existant.permissions, ...patch.permissions } }
      : {}),
    ...(patch.disabled !== undefined ? { disabled: !!patch.disabled } : {}),
    ...(patch.passwordHash !== undefined ? { passwordHash: patch.passwordHash } : {}),
  };
  await r.set(CLE_UTILISATEUR(nom), JSON.stringify(suivant));
  return suivant;
}

export async function deleteUser(username) {
  const nom = normaliserUsername(username);
  const r = getRedis();
  await r.del(CLE_UTILISATEUR(nom));
  await retirerDeLIndex(r, nom);
}

export async function compterAdmins() {
  const utilisateurs = await listUsers();
  return utilisateurs.filter((u) => u.role === "admin" && !u.disabled).length;
}
