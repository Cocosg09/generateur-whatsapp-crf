import { NextResponse } from "next/server";
import { signerSession, DUREE_SESSION_SECONDES } from "@/lib/auth-edge";
import { hacherMotDePasse, verifierMotDePasse } from "@/lib/auth-node";
import { getUser, createUser, normaliserUsername, PERMISSIONS_PAR_DEFAUT } from "@/lib/users";

const MAX_TENTATIVES = 5;
const FENETRE_MS = 10 * 60 * 1000; // 10 minutes
const tentativesParIp = new Map();

function estBloque(ip) {
  const entree = tentativesParIp.get(ip);
  if (!entree) return false;
  if (Date.now() - entree.debut > FENETRE_MS) {
    tentativesParIp.delete(ip);
    return false;
  }
  return entree.count >= MAX_TENTATIVES;
}

function enregistrerEchec(ip) {
  const entree = tentativesParIp.get(ip);
  if (!entree || Date.now() - entree.debut > FENETRE_MS) {
    tentativesParIp.set(ip, { count: 1, debut: Date.now() });
  } else {
    entree.count += 1;
  }
}

// Crée le tout premier compte admin au premier login réussi avec les
// identifiants du seed, s'il n'existe pas encore en base. Idempotent : une
// fois créé dans Redis, ce chemin n'est plus emprunté.
async function bootstrapAdminSiNecessaire(username, password) {
  const seedUser = normaliserUsername(process.env.INITIAL_ADMIN_USERNAME);
  const seedPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!seedUser || !seedPassword) return null;
  if (username !== seedUser || password !== seedPassword) return null;

  const existant = await getUser(seedUser);
  if (existant) return null;

  const passwordHash = await hacherMotDePasse(seedPassword);
  return createUser({
    username: seedUser,
    passwordHash,
    role: "admin",
    permissions: PERMISSIONS_PAR_DEFAUT,
    createdBy: seedUser,
  });
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";

  if (estBloque(ip)) {
    return NextResponse.json(
      { success: false, message: "Trop de tentatives, réessayez plus tard." },
      { status: 429 }
    );
  }

  const { username, password } = await request.json();
  const nom = normaliserUsername(username);

  if (!nom || typeof password !== "string") {
    enregistrerEchec(ip);
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    let utilisateur = await bootstrapAdminSiNecessaire(nom, password);
    if (!utilisateur) {
      utilisateur = await getUser(nom);
    }

    const motDePasseValide =
      utilisateur && !utilisateur.disabled && (await verifierMotDePasse(password, utilisateur.passwordHash));

    if (!motDePasseValide) {
      enregistrerEchec(ip);
      return NextResponse.json({ success: false }, { status: 401 });
    }

    tentativesParIp.delete(ip);
    const token = await signerSession({
      u: utilisateur.username,
      r: utilisateur.role,
      p: utilisateur.permissions,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DUREE_SESSION_SECONDES,
    });
    return response;
  } catch (err) {
    console.error("POST /api/login:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
