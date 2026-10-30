import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import { createSessionResponse } from "@/lib/server/session";

/**
 * POST /api/auth/google-signin
 *
 * Called after a successful client-side Google popup.
 * Body: { idToken, uid, name, email, photoURL }
 *
 * – Verifies the Google ID token before reading or writing user data.
 * – Creates a Firebase session cookie only after storing the RTDB profile.
 *
 * Response 200: { success, data: { uid, name, email, role, isNew } }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { idToken } = body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "A Google ID token is required." },
      { status: 400 },
    );
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return Response.json(
      { success: false, code: "INVALID_TOKEN", message: "Google sign-in could not be verified." },
      { status: 401 },
    );
  }

  if (
    decoded.firebase?.sign_in_provider !== "google.com" ||
    !decoded.email ||
    decoded.email_verified !== true
  ) {
    return Response.json(
      { success: false, code: "INVALID_PROVIDER", message: "A verified Google account is required." },
      { status: 401 },
    );
  }

  const uid = decoded.uid;
  const name = decoded.name ?? "";
  const email = decoded.email.toLowerCase();
  const photoURL = decoded.picture ?? "";
  const userRef = adminRTDB.ref(`users/${uid}`);
  const snapshot = await userRef.get();

  let isNew = false;
  let role = "user";

  if (snapshot.exists()) {
    const existing = snapshot.val();
    role = existing.type ?? "user";
    await userRef.update({ lastSeen: Date.now(), active: true });
  } else {
    isNew = true;
    const userRecord = {
      uid,
      name: name ?? "",
      email: email.toLowerCase(),
      username: "", // user completes in home
      phone: "",
      country: "",
      gender: "",
      birthday: "",
      bio: "",
      avatarURL: photoURL ?? "",
      photoURL: photoURL ?? "",
      type: "user",
      active: true,
      lastSeen: Date.now(),
      family: {},
    };
    await userRef.set(userRecord);
  }

  try {
    return await createSessionResponse(idToken, {
      name,
      email,
      role,
      isNew,
    });
  } catch (err) {
    console.error("Google session creation failed:", err);
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
