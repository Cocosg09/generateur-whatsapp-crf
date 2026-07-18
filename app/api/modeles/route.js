import Redis from "ioredis";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/session-guard";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
    redis.on("error", (err) => console.error("Erreur Redis:", err));
  }
  return redis;
}

const CLE = "modeles-postes";
const CHAMPS_TEXTE = ["nom", "heureRdv", "lieuRdv", "lieuPoste", "contacts", "vehicule"];

async function lireModeles(r) {
  const data = await r.get(CLE);
  return data ? JSON.parse(data) : [];
}

function estModeleValide(body) {
  if (!body || typeof body.id !== "string" || typeof body.nom !== "string" || !body.nom.trim()) {
    return false;
  }
  return CHAMPS_TEXTE.every(
    (champ) => body[champ] === undefined || typeof body[champ] === "string"
  );
}

export async function GET(request) {
  if (!(await requirePermission(request, "modeles"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const r = getRedis();
    const modeles = await lireModeles(r);
    return NextResponse.json(modeles);
  } catch (err) {
    console.error("GET /api/modeles:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  if (!(await requirePermission(request, "modeles"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!estModeleValide(body)) {
      return NextResponse.json({ message: "Modèle invalide." }, { status: 400 });
    }

    const r = getRedis();
    const modeles = await lireModeles(r);
    const nouveauModele = Object.fromEntries(
      [["id", body.id], ["nom", body.nom], ...CHAMPS_TEXTE.filter((c) => c !== "nom").map((c) => [c, body[c] || ""])]
    );
    const idx = modeles.findIndex((m) => m.id === body.id);
    const next =
      idx === -1
        ? [...modeles, nouveauModele]
        : modeles.map((m, i) => (i === idx ? nouveauModele : m));
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("POST /api/modeles:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}

export async function DELETE(request) {
  if (!(await requirePermission(request, "modeles"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body || typeof body.id !== "string") {
      return NextResponse.json({ message: "Entrée invalide." }, { status: 400 });
    }

    const r = getRedis();
    const modeles = await lireModeles(r);
    const next = modeles.filter((m) => m.id !== body.id);
    await r.set(CLE, JSON.stringify(next));
    return NextResponse.json(next);
  } catch (err) {
    console.error("DELETE /api/modeles:", err);
    return NextResponse.json(
      { message: "Service temporairement indisponible." },
      { status: 503 }
    );
  }
}
