import Redis from "ioredis";
import { NextResponse } from "next/server";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Erreur Redis:", err));
  }
  return redis;
}

const CLE = "historique-messages";
const MAX_HISTORIQUE = 50;
const MAX_TEXTE = 20000;

async function lireHistorique(r) {
  const data = await r.get(CLE);
  return data ? JSON.parse(data) : [];
}

export async function GET() {
  try {
    const r = getRedis();
    const historique = await lireHistorique(r);
    return NextResponse.json(historique);
  } catch (err) {
    console.error("GET /api/historique:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body.id !== "string" ||
      typeof body.texte !== "string" ||
      typeof body.date !== "string" ||
      body.texte.length > MAX_TEXTE
    ) {
      return NextResponse.json({ message: "Entrée invalide." }, { status: 400 });
    }

    const r = getRedis();
    const historique = await lireHistorique(r);
    const next = [
      { id: body.id, texte: body.texte, date: body.date },
      ...historique,
    ].slice(0, MAX_HISTORIQUE);
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("POST /api/historique:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Entrée invalide." }, { status: 400 });
    }

    const r = getRedis();
    const historique = await lireHistorique(r);
    const next = historique.filter((m) => m.id !== body.id);
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("DELETE /api/historique:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
