// Signature/vérification de session via Web Crypto (crypto.subtle), disponible
// à la fois sur le runtime Edge (middleware.js) et sur Node (routes API) —
// contrairement à node:crypto, qui a déjà cassé le middleware en prod par le
// passé (cf. historique git : MIDDLEWARE_INVOCATION_FAILED sur l'ancien proxy.js).

const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function encoderBase64Url(bytes) {
  let binaire = "";
  for (const octet of bytes) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decoderBase64Url(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binaire = atob(base64 + pad);
  const bytes = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) bytes[i] = binaire.charCodeAt(i);
  return bytes;
}

async function importerCle() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET n'est pas défini.");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Signe une session { u: username, r: role, p: permissions } et renvoie un
// token "payload.signature", chaque partie encodée en base64url.
export async function signerSession(donnees) {
  const cle = await importerCle();
  const payload = { ...donnees, iat: Date.now() };
  const payloadTexte = JSON.stringify(payload);
  const payloadEncode = encoderBase64Url(new TextEncoder().encode(payloadTexte));
  const signature = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(payloadEncode));
  const signatureEncodee = encoderBase64Url(new Uint8Array(signature));
  return `${payloadEncode}.${signatureEncodee}`;
}

// Vérifie un token de session et renvoie le payload décodé, ou null si
// invalide, mal signé, ou expiré.
export async function verifierSession(token) {
  if (!token || typeof token !== "string") return null;
  const [payloadEncode, signatureEncodee] = token.split(".");
  if (!payloadEncode || !signatureEncodee) return null;

  try {
    const cle = await importerCle();
    const signatureValide = await crypto.subtle.verify(
      "HMAC",
      cle,
      decoderBase64Url(signatureEncodee),
      new TextEncoder().encode(payloadEncode)
    );
    if (!signatureValide) return null;

    const payload = JSON.parse(new TextDecoder().decode(decoderBase64Url(payloadEncode)));
    if (typeof payload.iat !== "number" || Date.now() - payload.iat > DUREE_SESSION_MS) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const DUREE_SESSION_SECONDES = DUREE_SESSION_MS / 1000;
