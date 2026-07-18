// Hachage des mots de passe — Node uniquement (bcryptjs), jamais importé
// depuis middleware.js (runtime Edge). Voir lib/auth-edge.js pour la
// signature de session, elle, compatible Edge.
import bcrypt from "bcryptjs";

const TOURS_SALAGE = 10;

export async function hacherMotDePasse(motDePasse) {
  return bcrypt.hash(motDePasse, TOURS_SALAGE);
}

export async function verifierMotDePasse(motDePasse, hash) {
  return bcrypt.compare(motDePasse, hash);
}
