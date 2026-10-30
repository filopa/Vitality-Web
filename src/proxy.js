import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  clearLegacyAuthCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/server/session";

const protectedRoutes = [
  "/home",
  "/feed",
  "/complete-profile",
  "/signup/doctor/pending",
];
const authRoutes = ["/login", "/signup"];

export async function proxy(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  let response = NextResponse.next();

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    response = NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    response = NextResponse.redirect(new URL("/home", request.url));
  }

  if (sessionCookie && !isAuthenticated) clearSessionCookie(response);
  if (request.cookies.has("vitality_token")) clearLegacyAuthCookie(response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static, _next/image
     * - public files with extensions (e.g. .svg, .png, .ico, .css)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
