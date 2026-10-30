import { getMissingFields, toPublicProfile } from "@/lib/profile";
import { authenticate, fail, ok } from "@/lib/server/api";
import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import {
  clearLegacyAuthCookie,
  clearSessionCookie,
} from "@/lib/server/session";

export async function GET(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  try {
    const snapshot = await adminRTDB.ref(`users/${decoded.uid}`).get();
    if (!snapshot.exists()) {
      return clearSessionCookie(
        clearLegacyAuthCookie(
          fail(401, "PROFILE_NOT_FOUND", "Your account profile was not found."),
        ),
      );
    }

    const profile = snapshot.val();
    const response = ok({
      user: toPublicProfile(profile),
      profileComplete: getMissingFields(profile).length === 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    console.error("Session profile lookup failed:", err);
    return fail(503, "PROFILE_UNAVAILABLE", "We couldn't load your account.");
  }
}

export async function DELETE(request) {
  const { decoded, error } = await authenticate(request);
  if (error) {
    return clearLegacyAuthCookie(clearSessionCookie(ok({ signedOut: true })));
  }

  try {
    await adminAuth.revokeRefreshTokens(decoded.uid);
    return clearLegacyAuthCookie(
      clearSessionCookie(ok({ signedOut: true })),
    );
  } catch (err) {
    console.error("Session revocation failed:", err);
    return clearLegacyAuthCookie(
      clearSessionCookie(
        fail(503, "SIGN_OUT_FAILED", "We couldn't sign you out completely."),
      ),
    );
  }
}
