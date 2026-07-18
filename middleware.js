import { NextResponse } from "next/server";
import { verifierSession } from "./lib/auth-edge";

export async function middleware(request) {
  const cookie = request.cookies.get("session");
  const session = await verifierSession(cookie?.value);

  if (session) {
    const headers = new Headers(request.headers);
    headers.set("x-user", session.u);
    headers.set("x-role", session.r);
    return NextResponse.next({ request: { headers } });
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|login|api/login).*)",
};
