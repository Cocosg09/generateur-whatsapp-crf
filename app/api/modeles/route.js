import Redis from "ioredis";
import { NextResponse } from "next/server";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
  }
  return redis;
}

const CLE = "modeles-postes";

export async function GET() {
  const r = getRedis();
  const data = await r.get(CLE);
  const modeles = data ? JSON.parse(data) : [];
  return NextResponse.json(modeles);
}

export async function POST(request) {
  const r = getRedis();
  const nouveauModele = await request.json();
  const data = await r.get(CLE);
  const modeles = data ? JSON.parse(data) : [];
  const next = [...modeles, nouveauModele];
  await r.set(CLE, JSON.stringify(next));
  return NextResponse.json(next);
}

export async function DELETE(request) {
  const r = getRedis();
  const { id } = await request.json();
  const data = await r.get(CLE);
  const modeles = data ? JSON.parse(data) : [];
  const next = modeles.filter((m) => m.id !== id);
  await r.set(CLE, JSON.stringify(next));
  return NextResponse.json(next);
}