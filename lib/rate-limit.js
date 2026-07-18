import { getRedis } from "./users";

const FENETRE_SECONDES = 10 * 60; // 10 minutes

// Limiteur de tentatives par IP basé sur Redis (INCR/EXPIRE) : contrairement
// à un Map en mémoire, ce compteur est partagé entre toutes les instances
// serverless de Vercel plutôt que reparti à zéro sur chacune d'elles.
export async function estBloque(cle, maxTentatives) {
  const r = getRedis();
  const count = await r.get(cle);
  return count !== null && Number(count) >= maxTentatives;
}

export async function enregistrerEchec(cle) {
  const r = getRedis();
  const count = await r.incr(cle);
  if (count === 1) {
    await r.expire(cle, FENETRE_SECONDES);
  }
}

export async function reinitialiser(cle) {
  const r = getRedis();
  await r.del(cle);
}
