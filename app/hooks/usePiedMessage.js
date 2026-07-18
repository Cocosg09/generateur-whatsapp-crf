import { useEffect, useState } from "react";
import { PIED_MESSAGE_DEFAUT } from "@/lib/dps";

/**
 * Charge le pied de message (texte commun ajouté à la fin de tous les
 * messages, géré côté admin — ex : rappel véhicules aujourd'hui, mais son
 * contenu peut évoluer).
 */
export function usePiedMessage() {
  const [piedMessage, setPiedMessage] = useState(PIED_MESSAGE_DEFAUT);

  useEffect(() => {
    fetch("/api/pied-message")
      .then((res) => (res.ok ? res.json() : { texte: PIED_MESSAGE_DEFAUT }))
      .then((data) => setPiedMessage(data.texte ?? PIED_MESSAGE_DEFAUT))
      .catch(() => setPiedMessage(PIED_MESSAGE_DEFAUT));
  }, []);

  return { piedMessage };
}
