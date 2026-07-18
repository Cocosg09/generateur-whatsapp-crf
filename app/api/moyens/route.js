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

const CLE = "moyens";

async function lireMoyens(r) {
  const data = await r.get(CLE);
  return data ? JSON.parse(data) : [];
}

function estMoyenValide(body) {
  return (
    body &&
    typeof body.id === "string" &&
    typeof body.nom === "string" &&
    body.nom.trim() &&
    (body.materiel === undefined || typeof body.materiel === "string")
  );
}

// Lecture ouverte à quiconque peut éditer un poste : le sélecteur de moyen
// vit dans le formulaire des postes.
export async function GET(request) {
  if (!(await requirePermission(request, "postes"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const r = getRedis();
    const moyens = await lireMoyens(r);
    return NextResponse.json(moyens);
  } catch (err) {
    console.error("GET /api/moyens:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

// Écriture réservée à l'admin : le catalogue de moyens est une donnée d'unité,
// pas une préférence par utilisateur.
export async function POST(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!estMoyenValide(body)) {
      return NextResponse.json({ message: "Moyen invalide." }, { status: 400 });
    }

    const r = getRedis();
    const moyens = await lireMoyens(r);
    const nouveauMoyen = {
      id: body.id,
      nom: body.nom.trim(),
      materiel: (body.materiel || "").trim(),
    };
    const idx = moyens.findIndex((m) => m.id === body.id);
    const next =
      idx === -1
        ? [...moyens, nouveauMoyen]
        : moyens.map((m, i) => (i === idx ? nouveauMoyen : m));
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("POST /api/moyens:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Entrée invalide." }, { status: 400 });
    }

    const r = getRedis();
    const moyens = await lireMoyens(r);
    const next = moyens.filter((m) => m.id !== body.id);
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("DELETE /api/moyens:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
