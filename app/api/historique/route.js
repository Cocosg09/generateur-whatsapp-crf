import Redis from "ioredis";
import { NextResponse } from "next/server";

let redis;
function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL);
  }
  return redis;
}

const CLE = "historique-messages";
const MAX_HISTORIQUE = 50;

export async function GET() {
  const r = getRedis();
  const data = await r.get(CLE);
  const historique = data ? JSON.parse(data) : [];
  return NextResponse.json(historique);
}

export async function POST(request) {
  const r = getRedis();
  const nouveauMessage = await request.json();
  const data = await r.get(CLE);
  const historique = data ? JSON.parse(data) : [];
  const next = [nouveauMessage, ...historique].slice(0, MAX_HISTORIQUE);
  await r.set(CLE, JSON.stringify(next));
  return NextResponse.json(next);
}

export async function DELETE(request) {
  const r = getRedis();
  const { id } = await request.json();
  const data = await r.get(CLE);
  const historique = data ? JSON.parse(data) : [];
  const next = historique.filter((m) => m.id !== id);
  await r.set(CLE, JSON.stringify(next));
  return NextResponse.json(next);
}