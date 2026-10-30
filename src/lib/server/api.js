import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/server/session";

export const ok = (data, status = 200) => NextResponse.json({ success: true, data }, { status });

export const fail = (status, code, message, extra = {}) =>
  NextResponse.json({ success: false, code, message, ...extra }, { status });

/** Verifies the Bearer ID token. Returns { decoded } or { error: Response }. */
export async function authenticate(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { error: fail(401, "UNAUTHORIZED", "Please sign in.") };
  }

  try {
    return {
      decoded: await adminAuth.verifySessionCookie(sessionCookie, true),
    };
  } catch {
    const response = fail(
      401,
      "INVALID_SESSION",
      "Your session has expired. Please sign in again.",
    );
    return { error: clearSessionCookie(response) };
  }
}
