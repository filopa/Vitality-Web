import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import { mapFirebaseAuthError } from "@/lib/validations";
import {
  mapIdentityToolkitError,
  requestIdentityToolkit,
} from "@/lib/server/identity-toolkit";
import { createSessionResponse } from "@/lib/server/session";

// ─── POST /api/auth/signin ───────────────────────────────────────────────────

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        message: "Invalid JSON request body.",
      },
      { status: 400 }
    );
  }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // ── Validation: Check for required fields ─────────────────────────────────
  if (!email || !password) {
    const errors = {};
    if (!email) errors.email = "Email address is required.";
    if (!password) errors.password = "Password is required.";

    return Response.json(
      {
        success: false,
        code: "VALIDATION_ERROR",
        message: "Email and password are required.",
        errors,
      },
      { status: 400 }
    );
  }

  let identityResult;
  try {
    identityResult = await requestIdentityToolkit("accounts:signInWithPassword", {
      email: email.toLowerCase(),
      password,
      returnSecureToken: true,
    });
  } catch (err) {
    console.error("Firebase email sign-in request failed:", err);
    return Response.json(
      {
        success: false,
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "Sign-in is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }

  if (!identityResult.ok) {
    const mapped = mapFirebaseAuthError(
      mapIdentityToolkitError(identityResult.code),
    );
    return Response.json(
      { success: false, code: mapped.code, message: mapped.message },
      { status: mapped.status },
    );
  }

  const { idToken } = identityResult.data;
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch (err) {
    console.error("Firebase returned an invalid sign-in token:", err);
    return Response.json(
      {
        success: false,
        code: "INVALID_TOKEN",
        message: "Sign-in could not be verified. Please try again.",
      },
      { status: 401 },
    );
  }

  // ── Fetch user profile from RTDB to obtain role ──────────────────────────
  let role = "user";
  try {
    const userRef = adminRTDB.ref(`users/${decoded.uid}`);
    const snapshot = await userRef.get();

    if (!snapshot.exists()) {
      return Response.json(
        {
          success: false,
          code: "PROFILE_NOT_FOUND",
          message: "We couldn't find your account profile. Please contact support.",
        },
        { status: 403 },
      );
    }

    const data = snapshot.val();
    role = data.type || "user";
    await userRef.update({ lastSeen: Date.now(), active: true });
  } catch (err) {
    console.error("RTDB user fetch error:", err);
    return Response.json(
      {
        success: false,
        code: "PROFILE_UNAVAILABLE",
        message: "We couldn't load your account. Please try again.",
      },
      { status: 503 },
    );
  }

  try {
    return await createSessionResponse(idToken, { role });
  } catch (err) {
    console.error("Firebase session creation failed:", err);
    return Response.json(
      {
        success: false,
        code: "SESSION_CREATION_FAILED",
        message: "We couldn't create your session. Please try again.",
      },
      { status: 500 },
    );
  }
}
