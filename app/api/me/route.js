import { NextResponse } from "next/server";
import { getSessionUtilisateur } from "@/lib/session-guard";

export async function GET(request) {
  const session = await getSessionUtilisateur(request);
  if (!session) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }
  return NextResponse.json({ username: session.u, role: session.r, permissions: session.p });
}
