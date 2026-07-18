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

/**
 * Formate une plage horaire "HH:MM" / "HH:MM" au format utilisé dans le
 * formulaire (ex: "14H - 23H", ou "14H30 - 23H00" si les minutes comptent).
 */
export function formaterPlageHoraire(debut, fin) {
  const formater = (hhmm) => {
    const [h, m] = hhmm.split(":");
    return m === "00" ? `${h}H` : `${h}H${m}`;
  };
  return `${formater(debut)} - ${formater(fin)}`;
}

export const AVANCE_RDV_MINUTES_PAR_DEFAUT = 30;

/**
 * Calcule une heure de RDV suggérée à partir du début des horaires d'un
 * poste (ex: "12H - 19H" ou "14h30 - 23h00"), en retranchant une avance en
 * minutes (30 min par défaut pour un poste local, davantage si le lieu est
 * plus éloigné). Passe minuit si besoin (ex: début à 00H10 avec 30 min
 * d'avance renvoie la veille à 23h40). Renvoie "" si aucun horaire de début
 * n'est reconnaissable.
 */
export function calculerHeureRdv(horaires, avanceMinutes = AVANCE_RDV_MINUTES_PAR_DEFAUT) {
  const debut = horaires.trim().match(/^(\d{1,2})[Hh](\d{2})?/);
  if (!debut) return "";

  const minutesDebut = Number(debut[1]) * 60 + Number(debut[2] || 0);
  const minutesRdv = ((minutesDebut - avanceMinutes) % 1440 + 1440) % 1440;
  const h = Math.floor(minutesRdv / 60);
  const m = minutesRdv % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

const TOLERANCE_Y_LIGNE = 2;
const SEUIL_NOUVELLE_RANGEE = 10;

function normaliserEtiquette(texte) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase();
}

/**
 * Regroupe des items de texte positionnés (x, y) en lignes visuelles :
 * les items partageant sensiblement la même ordonnée sont concaténés dans
 * l'ordre de leur abscisse.
 */
function regrouperEnLignes(items) {
  const tries = items
    .filter((i) => i.texte.trim() !== "")
    .slice()
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const lignes = [];
  for (const item of tries) {
    const derniere = lignes[lignes.length - 1];
    if (derniere && Math.abs(item.y - derniere.y) <= TOLERANCE_Y_LIGNE) {
      derniere.items.push(item);
    } else {
      lignes.push({ y: item.y, items: [item] });
    }
  }
  return lignes.map((l) => ({
    y: l.y,
    texte: l.items
      .slice()
      .sort((a, b) => a.x - b.x)
      .map((i) => i.texte.trim())
      .join(" "),
  }));
}

// Colonnes du tableau "Personnes engagées", de gauche à droite. Les cellules
// d'en-tête qui se répartissent sur deux lignes ("Horaires" / "d'affectation",
// "Qualification -" / "Rôle") apparaissent comme deux items distincts : tous
// les motifs d'une même colonne doivent donc être reconnus.
const COLONNES_TABLE = [
  { cle: "affectation", motifs: ["affectation"] },
  { cle: "horaires", motifs: ["horaires", "d'affectation"] },
  { cle: "nom", motifs: ["nom prenom nivol"] },
  { cle: "qualification", motifs: ["qualification -", "qualification", "role"] },
  { cle: "structure", motifs: ["structure"] },
];

function trouverColonne(item) {
  const n = normaliserEtiquette(item.texte);
  return COLONNES_TABLE.find((c) => c.motifs.includes(n));
}

/**
 * Extrait les informations d'un ordre de mission Croix-Rouge à partir des
 * items de texte positionnés (str + coordonnées x/y) d'une page PDF, tels que
 * renvoyés par `page.getTextContent()` de pdfjs. Le tableau "Personnes
 * engagées" est reconstruit par position (colonnes) plutôt que par ordre de
 * lecture linéaire : dans le flux du PDF, le contenu d'une ligne de tableau
 * est réparti entre colonnes voisines partageant la même ordonnée plutôt que
 * cellule par cellule.
 */
export function extraireOrdreMission(items) {
  const lignes = regrouperEnLignes(items);
  const texteComplet = lignes.map((l) => l.texte).join("\n");

  const champ = (regex) => {
    const m = texteComplet.match(regex);
    return m ? m[1].trim() : "";
  };

  const objet = champ(/Objet\s+de la mission\s*:\s*(.+)/i);
  const lieu = champ(/Lieu d.exécution\s*:\s*(.+)/i);
  const contact = champ(/Contact sur place\s*:\s*(.+)/i);

  const horairesMatch = texteComplet.match(
    /Horaires de début et fin de mission\/?DPS\s*:\s*\d{2}\/\d{2}\/\d{4}\s+(\d{2}:\d{2})\s*\n\s*\d{2}\/\d{2}\/\d{4}\s+(\d{2}:\d{2})/i
  );
  const horaires = horairesMatch
    ? formaterPlageHoraire(horairesMatch[1], horairesMatch[2])
    : "";

  const posteSansTableau = () =>
    objet || lieu || contact
      ? [{ poste: objet, horaires, lieuPoste: lieu, contacts: contact, intervenants: [] }]
      : [];

  const ligneDebutTable = lignes.find(
    (l) => normaliserEtiquette(l.texte) === "personnes engagees"
  );
  const ligneFinTable = lignes.find((l) =>
    normaliserEtiquette(l.texte).includes("modalites operationnelles")
  );
  if (!ligneDebutTable) return posteSansTableau();

  const itemsZone = items.filter(
    (i) =>
      i.texte.trim() !== "" &&
      i.y < ligneDebutTable.y &&
      i.y > (ligneFinTable ? ligneFinTable.y : -Infinity)
  );

  const itemsEnTete = [];
  const colonneParCle = new Map();
  itemsZone.forEach((item) => {
    const colonne = trouverColonne(item);
    if (!colonne) return;
    itemsEnTete.push(item);
    const actuel = colonneParCle.get(colonne.cle);
    if (!actuel || item.x < actuel.x) colonneParCle.set(colonne.cle, item);
  });
  if (colonneParCle.size < COLONNES_TABLE.length) return posteSansTableau();

  const itemsEnTeteSet = new Set(itemsEnTete);
  const bornes = COLONNES_TABLE.map((c) => colonneParCle.get(c.cle).x);
  const frontieres = bornes.slice(1).map((x, i) => (x + bornes[i]) / 2);
  const colonneDe = (x) => {
    const idx = frontieres.findIndex((f) => x < f);
    return idx === -1 ? frontieres.length : idx;
  };

  const itemsCorps = itemsZone.filter((i) => !itemsEnTeteSet.has(i));
  const tries = itemsCorps.slice().sort((a, b) => b.y - a.y || a.x - b.x);

  const rangees = [];
  let precedenteY = null;
  for (const item of tries) {
    if (rangees.length > 0 && precedenteY - item.y <= SEUIL_NOUVELLE_RANGEE) {
      rangees[rangees.length - 1].push(item);
    } else {
      rangees.push([item]);
    }
    precedenteY = item.y;
  }

  const texteColonne = (rangee, indexColonne) =>
    rangee
      .filter((item) => colonneDe(item.x) === indexColonne)
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .map((i) => i.texte.trim())
      .join(" ")
      .trim();

  const personnes = rangees
    .map((rangee) => {
      const affectation = texteColonne(rangee, 0);
      const celluleNom = texteColonne(rangee, 2);
      const qualification = texteColonne(rangee, 3);
      const nomMatch = celluleNom.match(/^(.+?)\s*\([A-Za-z0-9]+\)$/);
      const nom = nomMatch ? nomMatch[1].trim() : celluleNom;
      return { affectation, nom, qualification };
    })
    .filter((p) => p.nom !== "");

  if (personnes.length === 0) return posteSansTableau();

  const groupes = new Map();
  personnes.forEach(({ affectation, nom, qualification }) => {
    const cle = affectation || objet;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push({
      role: trouverRole(qualification),
      nom,
      conducteur: false,
      typeVehicule: "VL",
    });
  });

  return Array.from(groupes.entries()).map(([affectation, intervenants]) => ({
    poste:
      objet && affectation && affectation !== objet
        ? `${objet} - ${affectation}`
        : affectation || objet,
    horaires,
    lieuPoste: lieu,
    contacts: contact,
    intervenants,
  }));
}

const CHAMPS_TEXTE_POSTE = [
  "poste",
  "horaires",
  "heureRdv",
  "lieuRdv",
  "lieuPoste",
  "contacts",
  "vehicule",
  "materiel",
];

/**
 * Prépare les postes du formulaire pour un stockage dans l'historique :
 * seuls les champs métier sont conservés (ni id, ni texte collé de
 * l'extraction), afin que l'entrée stockée soit compacte et stable.
 */
export function serialiserPostes(postes) {
  return postes.map((p) => {
    const compact = {};
    CHAMPS_TEXTE_POSTE.forEach((champ) => {
      compact[champ] = typeof p[champ] === "string" ? p[champ] : "";
    });
    compact.intervenants = (p.intervenants || [])
      .filter((i) => i && typeof i.nom === "string")
      .map((i) => ({
        role: trouverRole(typeof i.role === "string" ? i.role : ""),
        nom: i.nom,
        conducteur: !!i.conducteur,
        typeVehicule: i.typeVehicule === "VPSP" ? "VPSP" : "VL",
      }));
    return compact;
  });
}

/**
 * Reconstruit des postes de formulaire complets (id, valeurs par défaut)
 * depuis des données sérialisées par `serialiserPostes`. Renvoie `null` si
 * la structure n'est pas exploitable (données absentes ou malformées),
 * auquel cas l'appelant peut retomber sur `parserMessage`.
 */
export function restaurerPostes(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  if (!data.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    return null;
  }

  return data.map((item) => {
    const p = nouveauPoste();
    CHAMPS_TEXTE_POSTE.forEach((champ) => {
      if (typeof item[champ] === "string") p[champ] = item[champ];
    });
    const intervenants = Array.isArray(item.intervenants)
      ? item.intervenants
          .filter((i) => i && typeof i.nom === "string")
          .map((i) => ({
            role: trouverRole(typeof i.role === "string" ? i.role : ""),
            nom: i.nom,
            conducteur: !!i.conducteur,
            typeVehicule: i.typeVehicule === "VPSP" ? "VPSP" : "VL",
          }))
      : [];
    if (intervenants.length > 0) p.intervenants = intervenants;
    return p;
  });
}

// Texte commun ajouté en pied de tous les messages (aujourd'hui le rappel
// véhicules, mais géré depuis /admin car son contenu évolue avec le temps).
// Sert aussi de valeur par défaut tant que l'admin n'a rien enregistré.
export const PIED_MESSAGE_DEFAUT = `⚠️RAPPEL SUR LES VÉHICULES ⚠️
Merci de remplir les carnet de bord
Prêter une attention particulière à votre conduite
Prêter attention à l'état intérieur du véhicule
Et de faire le plein si besoin

Merci à tous et bon poste ! 👍
Dispo par message privé au besoin :)`;

export function construireMessage(postes, piedMessage = PIED_MESSAGE_DEFAUT) {
  const blocsPostes = postes
    .map((p) => {
      const entete = p.horaires.trim()
        ? `Poste ${p.poste} - ${p.horaires}`
        : `Poste ${p.poste}`;

      const rdvTexte = [
        p.heureRdv.trim() && `à ${p.heureRdv.trim()}`,
        p.lieuRdv.trim() && `au ${p.lieuRdv.trim()}`,
      ]
        .filter(Boolean)
        .join(" ");
      const ligneRdv = rdvTexte ? `📍 RDV ${rdvTexte}` : "";
      const ligneLieuPoste = p.lieuPoste.trim() ? `Lieux du poste: ${p.lieuPoste}` : "";
      const ligneContact = p.contacts.trim() ? `Contact sur place : ${p.contacts}` : "";
      const blocRdv = [ligneRdv, ligneLieuPoste, ligneContact].filter(Boolean).join("\n");

      const listeIntervenants = p.intervenants
        .filter((i) => i.nom.trim() !== "")
        .map((i) => {
          const suffixe = i.conducteur ? ` (Conducteur ${i.typeVehicule})` : "";
          return `• ${i.role}${suffixe} : ${i.nom}`;
        })
        .join("\n");
      const blocIntervenants = listeIntervenants ? `🚑\n${listeIntervenants}` : "";

      const ligneVehicule = p.vehicule.trim() ? `Véhicule: ${p.vehicule}` : "";

      const materielLignes = p.materiel
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");
      const blocMateriel =
        materielLignes.length > 0
          ? `🎒 Matériel à apporter\n${materielLignes.map((l) => `• ${l}`).join("\n")}`
          : "";

      return [entete, blocRdv, blocIntervenants, ligneVehicule, blocMateriel]
        .filter((section) => section !== "")
        .join("\n\n");
    })
    .join("\n\n---\n\n");

  return piedMessage.trim() ? `${blocsPostes}\n\n${piedMessage}` : blocsPostes;
}

/**
 * Reconstruit la liste des postes à partir d'un message final déjà généré
 * (utilisé pour recharger un message de l'historique dans le formulaire).
 */
export function parserMessage(texte, piedMessage = PIED_MESSAGE_DEFAUT) {
  // Le pied de message est enregistré côté admin et peut avoir changé depuis
  // qu'un ancien message de l'historique a été généré : on retire d'abord le
  // pied actuel s'il est présent tel quel, sinon celui par défaut (anciennes
  // entrées), pour ne pas polluer le dernier poste avec ce texte commun.
  let zonePostes = texte;
  if (piedMessage.trim()) zonePostes = zonePostes.split(`\n\n${piedMessage}`)[0];
  if (PIED_MESSAGE_DEFAUT.trim()) zonePostes = zonePostes.split(`\n\n${PIED_MESSAGE_DEFAUT}`)[0];
  const blocs = zonePostes.split("\n\n---\n\n");

  return blocs.map((bloc) => {
    // Le nom du poste peut lui-même contenir un tiret (ex: "14 Juillet - PAPS") ;
    // on ancre donc la coupure sur le format d'horaires "HH - HH" en priorité.
    // Si les horaires n'ont pas été renseignés, la ligne n'a pas de suffixe
    // " - ..." et le nom du poste est repris tel quel.
    const posteMatch =
      bloc.match(/^Poste (.+) - (\d{2}H\s*-\s*\d{2}H)$/m) ||
      bloc.match(/^Poste (.+?) - (.+)$/m) ||
      bloc.match(/^Poste (.+)$/m);
    const rdvCompletMatch = bloc.match(/^📍 RDV à (.+?) au (.+)$/m);
    const rdvHeureMatch = bloc.match(/^📍 RDV à (.+)$/m);
    const rdvLieuMatch = bloc.match(/^📍 RDV au (.+)$/m);
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
      horaires: posteMatch ? posteMatch[2] || "" : "",
      heureRdv: rdvCompletMatch ? rdvCompletMatch[1] : rdvHeureMatch ? rdvHeureMatch[1] : "",
      lieuRdv: rdvCompletMatch ? rdvCompletMatch[2] : rdvLieuMatch ? rdvLieuMatch[1] : "",
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
