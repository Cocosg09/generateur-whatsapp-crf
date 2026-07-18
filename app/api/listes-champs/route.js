import Redis from "ioredis";
import { NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/session-guard";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Erreur Redis:", err));
  }
  return redis;
}

const CLE = "listes-champs";
export const CHAMPS_LISTE = ["heureRdv", "lieuRdv", "lieuPoste", "contacts"];

async function lireListes(r) {
  const data = await r.get(CLE);
  const listes = data ? JSON.parse(data) : {};
  return Object.fromEntries(CHAMPS_LISTE.map((c) => [c, listes[c] || []]));
}

function estRequeteValide(body) {
  return (
    body &&
    CHAMPS_LISTE.includes(body.champ) &&
    Array.isArray(body.valeurs) &&
    body.valeurs.every((v) => typeof v === "string")
  );
}

// Lecture ouverte à quiconque peut éditer un poste : les suggestions vivent
// dans le formulaire des postes.
export async function GET(request) {
  if (!(await requirePermission(request, "postes"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const r = getRedis();
    const listes = await lireListes(r);
    return NextResponse.json(listes);
  } catch (err) {
    console.error("GET /api/listes-champs:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

// Écriture réservée à l'admin : les suggestions sont une donnée d'unité,
// pas une préférence par utilisateur.
export async function PUT(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!estRequeteValide(body)) {
      return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
    }

    const r = getRedis();
    const listes = await lireListes(r);
    const valeurs = body.valeurs.map((v) => v.trim()).filter(Boolean);
    const next = { ...listes, [body.champ]: valeurs };
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("PUT /api/listes-champs:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
