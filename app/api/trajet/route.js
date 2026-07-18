import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/session-guard";

// Adresse de départ fixe (Nouveau Pôle, Pamiers) : tous les trajets sont
// calculés depuis ce point. À mettre à jour ici si le pôle opérationnel
// déménage.
const ADRESSE_DEPART = "23 Rue Hélène Boucher, 09100 Pamiers";

// Coordonnées du point de départ mises en cache en mémoire du process : elles
// ne changent jamais, inutile de regéocoder l'adresse de départ à chaque
// requête.
let coordonneesDepart = null;

async function geocoder(adresse) {
  const url = new URL("https://api.openrouteservice.org/geocode/search");
  url.searchParams.set("api_key", process.env.ORS_API_KEY);
  url.searchParams.set("text", adresse);
  url.searchParams.set("size", "1");
  url.searchParams.set("boundary.country", "FRA");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocodage échoué (${res.status})`);
  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  return Array.isArray(coords) ? coords : null;
}

async function calculerDureeTrajet(depart, arrivee) {
  const url = new URL("https://api.openrouteservice.org/v2/directions/driving-car");
  url.searchParams.set("api_key", process.env.ORS_API_KEY);
  url.searchParams.set("start", `${depart[0]},${depart[1]}`);
  url.searchParams.set("end", `${arrivee[0]},${arrivee[1]}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Calcul d'itinéraire échoué (${res.status})`);
  const data = await res.json();
  const duree = data.features?.[0]?.properties?.summary?.duration;
  return typeof duree === "number" ? duree : null;
}

export async function POST(request) {
  if (!(await requirePermission(request, "postes"))) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }
  if (!process.env.ORS_API_KEY) {
    return NextResponse.json(
      { message: "Calcul de trajet non configuré (clé ORS_API_KEY manquante)." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    if (!body || typeof body.adresse !== "string" || !body.adresse.trim()) {
      return NextResponse.json({ message: "Adresse manquante." }, { status: 400 });
    }

    if (!coordonneesDepart) {
      coordonneesDepart = await geocoder(ADRESSE_DEPART);
    }
    if (!coordonneesDepart) {
      return NextResponse.json(
        { message: "Adresse de départ introuvable." },
        { status: 502 }
      );
    }

    const coordonneesArrivee = await geocoder(body.adresse);
    if (!coordonneesArrivee) {
      return NextResponse.json(
        { message: "Adresse du poste introuvable, vérifiez son orthographe." },
        { status: 422 }
      );
    }

    const dureeSecondes = await calculerDureeTrajet(coordonneesDepart, coordonneesArrivee);
    if (dureeSecondes == null) {
      return NextResponse.json(
        { message: "Aucun itinéraire trouvé entre ces deux adresses." },
        { status: 422 }
      );
    }

    return NextResponse.json({ minutes: Math.round(dureeSecondes / 60) });
  } catch (err) {
    console.error("POST /api/trajet:", err);
    return NextResponse.json(
      { message: "Service de calcul d'itinéraire temporairement indisponible." },
      { status: 503 }
    );
  }
}
