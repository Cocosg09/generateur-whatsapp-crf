import Redis from "ioredis";
import { NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/session-guard";
import { PIED_MESSAGE_DEFAUT } from "@/lib/dps";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Erreur Redis:", err));
  }
  return redis;
}

const CLE = "pied-message";

// Lecture ouverte à quiconque peut éditer un poste : le pied de message est
// ajouté au message généré dans le formulaire des postes.
export async function GET(request) {
  if (!(await requirePermission(request, "postes"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const r = getRedis();
    const texte = await r.get(CLE);
    return NextResponse.json({ texte: texte ?? PIED_MESSAGE_DEFAUT });
  } catch (err) {
    console.error("GET /api/pied-message:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

// Écriture réservée à l'admin : le pied de message est une donnée d'unité,
// commune à tous les messages générés, pas une préférence par utilisateur.
export async function PUT(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body || typeof body.texte !== "string") {
      return NextResponse.json({ message: "Requête invalide." }, { status: 400 });
    }

    const r = getRedis();
    const texte = body.texte.trimEnd();
    await r.set(CLE, texte);
    return NextResponse.json({ texte });
  } catch (err) {
    console.error("PUT /api/pied-message:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
