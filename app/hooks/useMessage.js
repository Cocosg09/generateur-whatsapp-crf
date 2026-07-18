import { useMemo, useState } from "react";
import { construireMessage } from "@/lib/dps";

/**
 * Détient le message final. Il est généré automatiquement depuis les postes,
 * mais reste éditable à la main : tant que l'utilisateur ne l'a pas retouché
 * (`desynchronise`), le message suit l'aperçu du formulaire.
 *
 * La synchronisation se fait pendant le rendu plutôt que dans un effet
 * (cf. https://react.dev/learn/you-might-not-need-an-effect).
 */
export function useMessage(postes) {
  const [message, setMessage] = useState("");
  const [desynchronise, setDesynchronise] = useState(false);
  const [dernierApercuSynchronise, setDernierApercuSynchronise] = useState("");

  const apercu = useMemo(() => construireMessage(postes), [postes]);

  if (apercu !== dernierApercuSynchronise) {
    setDernierApercuSynchronise(apercu);
    if (!desynchronise) {
      setMessage(apercu);
    }
  }

  function resynchroniser() {
    setMessage(apercu);
    setDesynchronise(false);
  }

  return { message, setMessage, desynchronise, setDesynchronise, resynchroniser };
}
