import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const MAX_TENTATIVES = 5;
const FENETRE_MS = 10 * 60 * 1000; // 10 minutes
const tentativesParIp = new Map();

function correspondEnTempsConstant(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";

  if (estBloque(ip)) {
    return NextResponse.json(
      { success: false, message: "Trop de tentatives, réessayez plus tard." },
      { status: 429 }
    );
  }

  const { password } = await request.json();
  const expected = process.env.APP_PASSWORD;

  if (
    typeof password === "string" &&
    expected &&
    correspondEnTempsConstant(password, expected)
  ) {
    tentativesParIp.delete(ip);
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    });
    return response;
  }

  enregistrerEchec(ip);
  return NextResponse.json({ success: false }, { status: 401 });
}
