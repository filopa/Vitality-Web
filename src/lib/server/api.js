import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const ok = (data, status = 200) => NextResponse.json({ success: true, data }, { status });

export const fail = (status, code, message, extra = {}) =>
  NextResponse.json({ success: false, code, message, ...extra }, { status });

/** Verifies the Bearer ID token. Returns { decoded } or { error: Response }. */
export async function authenticate(request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return { error: fail(401, "UNAUTHORIZED", "Please sign in.") };

  try {
    return { decoded: await adminAuth.verifyIdToken(token) };
  } catch {
    return { error: fail(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.") };
  }
}
