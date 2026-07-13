import pdfParse from "pdf-parse";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return Response.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdfParse(buffer);
  const texte = data.text;

  function extraire(regex) {
    const m = texte.match(regex);
    return m ? m[1].trim() : "";
  }

  const posteEtHoraires = texte.match(/Poste\s+(.+?)\s*-\s*(\d{1,2}H\s*-\s*\d{1,2}H)/i);
  const poste = posteEtHoraires ? posteEtHoraires[1].trim() : "";
  const horaires = posteEtHoraires ? posteEtHoraires[2].replace(/\s+/g, " ").trim() : "";

  const rdv = texte.match(/RDV\s*(?:à|a)\s*(\d{1,2}h\d{0,2})\s*(?:au|à)\s*([^\n]+)/i);
  const heureRdv = rdv ? rdv[1].trim() : "";
  const lieuRdv = rdv ? rdv[2].trim() : "";

  const lieuPoste = extraire(/Lieux?\s+du\s+poste\s*:\s*([^\n]+)/i);
  const vehicule = extraire(/V[ée]hicule\s*:\s*([^\n]+)/i);

  // Le "Contact sur place" du bloc opérationnel est celui qui suit "Lieux du poste"
  const contactMatch = texte.match(/Lieux?\s+du\s+poste\s*:[^\n]*\n[^\n]*Contact sur place\s*:\s*([^\n]+)/i);
  const contacts = contactMatch ? contactMatch[1].trim() : "";

  return Response.json({
    poste,
    horaires,
    heureRdv,
    lieuRdv,
    lieuPoste,
    contacts,
    vehicule,
    texteBrut: texte, // utile pour déboguer si un champ ne matche pas
  });
}