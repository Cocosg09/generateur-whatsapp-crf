import { NextResponse } from "next/server";

export function middleware(request) {
  const cookie = request.cookies.get("auth");
  const expected = process.env.APP_PASSWORD;

  if (expected && cookie?.value === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|login|api/login).*)",
};
