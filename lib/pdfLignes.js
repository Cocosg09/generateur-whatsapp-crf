/**
 * Extraction du texte d'un PDF en lignes, dans l'ordre de lecture visuel
 * (haut → bas, gauche → droite), en regroupant les items de texte par
 * position plutôt qu'en suivant l'ordre du flux de contenu du PDF (qui peut
 * différer de l'ordre visuel selon l'outil qui a généré le document).
 *
 * Ce module n'est utilisable que côté navigateur (pdfjs-dist s'appuie sur le
 * DOM / un worker web).
 */

const TOLERANCE_Y = 2;

export async function extraireLignesDuPdf(arrayBuffer) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lignes = [];

  for (let numPage = 1; numPage <= pdf.numPages; numPage++) {
    const page = await pdf.getPage(numPage);
    const contenu = await page.getTextContent();

    const items = contenu.items
      .filter((item) => item.str.trim() !== "")
      .map((item) => ({
        texte: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

    items.sort((a, b) => (b.y - a.y === 0 ? a.x - b.x : b.y - a.y));

    let ligneCourante = [];
    let yCourant = null;
    for (const item of items) {
      if (yCourant === null || Math.abs(item.y - yCourant) <= TOLERANCE_Y) {
        ligneCourante.push(item);
        yCourant = yCourant === null ? item.y : yCourant;
      } else {
        lignes.push(trierEtJoindre(ligneCourante));
        ligneCourante = [item];
        yCourant = item.y;
      }
    }
    if (ligneCourante.length > 0) {
      lignes.push(trierEtJoindre(ligneCourante));
    }
  }

  return lignes;
}

function trierEtJoindre(itemsLigne) {
  return itemsLigne
    .slice()
    .sort((a, b) => a.x - b.x)
    .map((i) => i.texte.trim())
    .filter(Boolean)
    .join(" ");
}
