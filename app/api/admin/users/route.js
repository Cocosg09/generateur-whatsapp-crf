import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session-guard";
import { hacherMotDePasse } from "@/lib/auth-node";
import { createUser, listUsers, normaliserUsername } from "@/lib/users";

function sansHash(utilisateur) {
  const { passwordHash: _passwordHash, ...reste } = utilisateur;
  return reste;
}

export async function GET(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const utilisateurs = await listUsers();
    return NextResponse.json(utilisateurs.map(sansHash));
  } catch (err) {
    console.error("GET /api/admin/users:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const username = normaliserUsername(body?.username);
    const password = body?.password;

    if (!username || username.length < 3 || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Nom d'utilisateur (min. 3 caractères) et mot de passe (min. 8 caractères) requis." },
        { status: 400 }
      );
    }

    const passwordHash = await hacherMotDePasse(password);
    const utilisateur = await createUser({
      username,
      passwordHash,
      role: body.role === "admin" ? "admin" : "user",
      permissions: body.permissions,
      createdBy: session.u,
    });
    return NextResponse.json(sansHash(utilisateur), { status: 201 });
  } catch (err) {
    if (err.message === "Ce nom d'utilisateur existe déjà.") {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }
    console.error("POST /api/admin/users:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
