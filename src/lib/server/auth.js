import { adminAuth } from "@/lib/firebase-admin";

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Cookie(s) your login sets. Adjust to match your project.
const SESSION_COOKIE_NAMES = ["session", "vitality_token"];

function readBearerToken(request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

function readCookieToken(request) {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = request.cookies.get(name)?.value;
    if (value) return value;
  }
  return null;
}

// A cookie can hold either a Firebase session cookie or a plain ID token.
async function verifyCookieToken(value) {
  try {
    return await adminAuth.verifySessionCookie(value, true);
  } catch {
    return adminAuth.verifyIdToken(value);
  }
}

/**
 * Verifies the caller. Accepts "Authorization: Bearer <ID token>" or the session cookie.
 * Returns { uid, email, decoded } or throws AuthError.
 */
export async function verifyRequestToken(request) {
  const bearer = readBearerToken(request);
  const cookie = bearer ? null : readCookieToken(request);
  if (!bearer && !cookie) throw new AuthError("UNAUTHORIZED", "Please sign in.");

  try {
    const decoded = bearer ? await adminAuth.verifyIdToken(bearer) : await verifyCookieToken(cookie);
    return { uid: decoded.uid, email: decoded.email ?? null, decoded };
  } catch {
    throw new AuthError("INVALID_TOKEN", "Your session has expired. Please sign in again.");
  }
}
