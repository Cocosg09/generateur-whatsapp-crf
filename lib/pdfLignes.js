/**
 * Extraction des items de texte positionnés (str + coordonnées x/y) d'un
 * PDF, page par page, tels que renvoyés par pdfjs. La reconstruction en
 * lignes/colonnes visuelles (le tableau "Personnes engagées" notamment) est
 * faite par `extraireOrdreMission` dans lib/dps.js, à partir de ces positions
 * plutôt que de l'ordre du flux de contenu du PDF.
 *
 * Ce module n'est utilisable que côté navigateur (pdfjs-dist s'appuie sur le
 * DOM / un worker web).
 */

export async function extraireItemsDuPdf(arrayBuffer) {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let numPage = 1; numPage <= pdf.numPages; numPage++) {
    const page = await pdf.getPage(numPage);
    const contenu = await page.getTextContent();
    pages.push(
      contenu.items
        .filter((item) => item.str.trim() !== "")
        .map((item) => ({
          texte: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
    );
  }

  return pages;
}
