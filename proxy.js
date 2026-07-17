import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function correspondEnTempsConstant(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
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