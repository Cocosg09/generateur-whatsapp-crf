import { NextResponse } from "next/server";

// Comparaison en temps constant sans dépendre de node:crypto/Buffer :
// le Proxy s'exécute sur le runtime Edge de Vercel, qui n'expose pas ces API Node.
function correspondEnTempsConstant(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function proxy(request) {
  const cookie = request.cookies.get("auth");
  const expected = process.env.APP_PASSWORD;

  if (expected && cookie?.value && correspondEnTempsConstant(cookie.value, expected)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|login|api/login).*)",
};