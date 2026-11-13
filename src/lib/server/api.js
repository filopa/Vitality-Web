import { NextResponse } from "next/server";
import { adminAuth, adminRTDB } from "@/lib/firebase-admin";

export const ok = (data, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (status, code, message, extra = {}) =>
  NextResponse.json({ success: false, code, message, ...extra }, { status });

export async function authenticate(request, { allowMissingProfile = false } = {}) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) {
    return {
      error: fail(401, "UNAUTHORIZED", "A valid Firebase ID token is required."),
    };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(match[1], true);
  } catch {
    return {
      error: fail(401, "INVALID_TOKEN", "Your authentication token is invalid or expired."),
    };
  }

  let user = null;
  try {
    const snapshot = await adminRTDB.ref(`users/${decoded.uid}`).get();
    user = snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Authenticated user lookup failed:", error);
    return {
      error: fail(503, "PROFILE_UNAVAILABLE", "We couldn't verify your account permissions."),
    };
  }

  if (!user && !allowMissingProfile) {
    return {
      error: fail(403, "PROFILE_NOT_FOUND", "Your account profile was not found."),
    };
  }

  return {
    decoded,
    user,
    role: user?.type ?? null,
    verified: user?.type === "doctor" && user?.verified === true,
  };
}

export function requireRole(authenticated, role) {
  if (authenticated.error) return authenticated.error;
  if (authenticated.role !== role) {
    return fail(403, "FORBIDDEN", "You don't have permission to perform this action.");
  }
  return null;
}

export function requireVerifiedDoctor(authenticated) {
  if (authenticated.error) return authenticated.error;
  if (authenticated.role !== "doctor" || !authenticated.verified) {
    return fail(
      403,
      "DOCTOR_VERIFICATION_REQUIRED",
      "An approved doctor account is required for this action.",
    );
  }
  return null;
}
