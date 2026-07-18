import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session-guard";
import { hacherMotDePasse } from "@/lib/auth-node";
import { getUser, updateUser, deleteUser, normaliserUsername, compterAdmins } from "@/lib/users";

function sansHash(utilisateur) {
  const { passwordHash: _passwordHash, ...reste } = utilisateur;
  return reste;
}

export async function PATCH(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  try {
    const { username } = await params;
    const nom = normaliserUsername(username);
    const existant = await getUser(nom);
    if (!existant) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    const body = await request.json();
    const patch = {};

    if (body.role !== undefined) patch.role = body.role;
    if (body.permissions !== undefined) patch.permissions = body.permissions;
    if (body.disabled !== undefined) patch.disabled = body.disabled;
    if (typeof body.password === "string" && body.password.length >= 8) {
      patch.passwordHash = await hacherMotDePasse(body.password);
    }

    const retrogradeOuDesactive =
      existant.role === "admin" &&
      ((patch.role && patch.role !== "admin") || patch.disabled === true);
    if (retrogradeOuDesactive && (await compterAdmins()) <= 1) {
      return NextResponse.json(
        { message: "Impossible de retirer les droits admin du dernier administrateur." },
        { status: 409 }
      );
    }

    const suivant = await updateUser(nom, patch);
    return NextResponse.json(sansHash(suivant));
  } catch (err) {
    console.error("PATCH /api/admin/users/[username]:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  try {
    const { username } = await params;
    const nom = normaliserUsername(username);
    const existant = await getUser(nom);
    if (!existant) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    if (existant.role === "admin" && (await compterAdmins()) <= 1) {
      return NextResponse.json(
        { message: "Impossible de supprimer le dernier administrateur." },
        { status: 409 }
      );
    }

    await deleteUser(nom);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/[username]:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
