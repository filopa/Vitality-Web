import { NextResponse } from "next/server";

const protectedRoutes = ["/feed", "/dashboard", "/onboarding"];
const authRoutes = ["/login", "/signup"];

export function middleware(request) {
  const token = request.cookies.get("vitality_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access protected route without valid session token -> redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user tries to access /login or /signup -> redirect to /feed
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
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

