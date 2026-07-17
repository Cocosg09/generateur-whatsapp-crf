export const ROLES_COURANTS = [
  "PSE",
  "Secouriste",
  "Équipier secouriste",
  "Chef de poste",
  "Chef d'intervention",
  "Conducteur VPSP",
];

export function nouvelIntervenant() {
  return { role: "PSE", nom: "", conducteur: false, typeVehicule: "VL" };
}

export function nouveauPoste() {
  return {
    id: crypto.randomUUID(),
    poste: "",
    horaires: "",
    heureRdv: "",
    lieuRdv: "",
    lieuPoste: "",
    contacts: "",
    vehicule: "",
    materiel: "",
    intervenants: [nouvelIntervenant()],
    texteCollé: "",
  };
}

export function trouverRole(texte) {
  const t = texte.trim().toLowerCase();
  const trouve = ROLES_COURANTS.find((r) => r.toLowerCase() === t);
  return trouve || ROLES_COURANTS[0];
}

export function extraireHeures(raw) {
  const match = raw.match(/(\d{2}):(\d{2}).*?(\d{2}):(\d{2})/);
  return match ? `${match[1]}H - ${match[3]}H` : "";
}

export function formaterDate(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Parse un tableau collé (qualifications / intervenants / horaires) en un
 * aperçu { poste, horaires, intervenants } à confirmer par l'utilisateur.
 */
export function extraireDuTableauTexte(texteCollé) {
  const lignes = texteCollé
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const headerIdx = lignes.findIndex((l) =>
    l.toLowerCase().includes("qualifications")
  );

  let nomPoste = "";
  if (headerIdx > 0) {
    const candidate = lignes[headerIdx - 1];
    const estBruit =
      /^\d+%$/.test(candidate) ||
      ["public", "privé", "secteur par défaut"].includes(candidate.toLowerCase());
    if (!estBruit) nomPoste = candidate;
  }

  const donnees = headerIdx !== -1 ? lignes.slice(headerIdx + 1) : lignes;

  const intervenants = [];
  let horaires = "";

  for (let i = 0; i < donnees.length; i += 3) {
    const role = donnees[i];
    const nom = donnees[i + 1];
    const horairesRaw = donnees[i + 2];
    if (role && nom) {
      intervenants.push({
        role: trouverRole(role),
        nom,
        conducteur: false,
        typeVehicule: "VL",
      });
      if (!horaires && horairesRaw) {
        horaires = extraireHeures(horairesRaw);
      }
    }
  }

  return { poste: nomPoste, horaires, intervenants };
}

export function construireMessage(postes) {
  const blocsPostes = postes
    .map((p) => {
      const listeIntervenants = p.intervenants
        .filter((i) => i.nom.trim() !== "")
        .map((i) => {
          const suffixe = i.conducteur ? ` (Conducteur ${i.typeVehicule})` : "";
          return `• ${i.role}${suffixe} : ${i.nom}`;
        })
        .join("\n");

      const materielLignes = p.materiel
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");
      const blocMateriel =
        materielLignes.length > 0
          ? `\n\n🎒 Matériel à apporter\n${materielLignes.map((l) => `• ${l}`).join("\n")}`
          : "";

      return `Poste ${p.poste} - ${p.horaires}

📍 RDV à ${p.heureRdv} au ${p.lieuRdv}
Lieux du poste: ${p.lieuPoste}
Contact sur place : ${p.contacts}

🚑
${listeIntervenants}

Véhicule: ${p.vehicule}${blocMateriel}`;
    })
    .join("\n\n---\n\n");

  return `${blocsPostes}

⚠️RAPPEL SUR LES VÉHICULES ⚠️
Merci de remplir les carnet de bord
Prêter une attention particulière à votre conduite
Prêter attention à l'état intérieur du véhicule
Et de faire le plein si besoin

Merci à tous et bon poste ! 👍
Dispo par message privé au besoin :)`;
}

/**
 * Reconstruit la liste des postes à partir d'un message final déjà généré
 * (utilisé pour recharger un message de l'historique dans le formulaire).
 */
export function parserMessage(texte) {
  const zonePostes = texte.split("\n\n⚠️RAPPEL SUR LES VÉHICULES")[0];
  const blocs = zonePostes.split("\n\n---\n\n");

  return blocs.map((bloc) => {
    // Le nom du poste peut lui-même contenir un tiret (ex: "14 Juillet - PAPS") ;
    // on ancre donc la coupure sur le format d'horaires "HH - HH" en priorité.
    const posteMatch =
      bloc.match(/^Poste (.+) - (\d{2}H\s*-\s*\d{2}H)$/m) ||
      bloc.match(/^Poste (.+?) - (.+)$/m);
    const rdvMatch = bloc.match(/RDV à (.+?) au (.+)$/m);
    const lieuMatch = bloc.match(/Lieux du poste: (.+)$/m);
    const contactMatch = bloc.match(/Contact sur place : (.+)$/m);
    const vehiculeMatch = bloc.match(/Véhicule: (.+)$/m);
    const materielMatch = bloc.match(/🎒 Matériel à apporter\n([\s\S]+)$/);

    const intervenants = [];
    const lignesIntervenants = bloc.match(/^• .+$/gm) || [];
    lignesIntervenants.forEach((ligne) => {
      const m = ligne.match(/^• (.+?)(?: \(Conducteur (VL|VPSP)\))? : (.+)$/);
      if (m) {
        intervenants.push({
          role: trouverRole(m[1]),
          nom: m[3],
          conducteur: !!m[2],
          typeVehicule: m[2] || "VL",
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      poste: posteMatch ? posteMatch[1] : "",
      horaires: posteMatch ? posteMatch[2] : "",
      heureRdv: rdvMatch ? rdvMatch[1] : "",
      lieuRdv: rdvMatch ? rdvMatch[2] : "",
      lieuPoste: lieuMatch ? lieuMatch[1] : "",
      contacts: contactMatch ? contactMatch[1] : "",
      vehicule: vehiculeMatch ? vehiculeMatch[1] : "",
      materiel: materielMatch
        ? materielMatch[1]
            .split("\n")
            .map((l) => l.replace(/^• /, "").trim())
            .filter(Boolean)
            .join("\n")
        : "",
      intervenants: intervenants.length > 0 ? intervenants : [nouvelIntervenant()],
      texteCollé: "",
    };
  });
}
