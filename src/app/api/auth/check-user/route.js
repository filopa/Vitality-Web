import { NextResponse } from "next/server";
import { adminRTDB } from "@/lib/firebase-admin";
import { authenticate } from "@/lib/server/api";

const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const fail = (status, code, message) => json({ success: false, code, message }, status);

/** True if a Vitality profile already exists for this Google/Firebase account. */
async function userExists({ uid, email }) {
  // 1) By uid (users/{uid})
  const byUid = await adminRTDB.ref(`users/${uid}`).get();
  if (byUid.exists()) return true;

  // 2) By email, in case the profile was created under a different key.
  //    Add ".indexOn": ["email"] under "users" in your Realtime Database rules.
  if (!email) return false;
  const byEmail = await adminRTDB
    .ref("users")
    .orderByChild("email")
    .equalTo(email.toLowerCase())
    .limitToFirst(1)
    .get();

  return byEmail.exists();
}

/**
 * POST /api/auth/check-user
 * Header: Authorization: Bearer <Firebase ID token>
 * Response: { success: true, data: { exists: boolean } }
 *
 * The uid/email are taken from the VERIFIED token, not from the request body,
 * so nobody can use this endpoint to find out whether someone else's email is registered.
 */
export async function POST(request) {
  const authenticated = await authenticate(request, { allowMissingProfile: true });
  if (authenticated.error) return authenticated.error;

  try {
    const exists = await userExists({
      uid: authenticated.decoded.uid,
      email: authenticated.decoded.email,
    });
    return json({ success: true, data: { exists } });
  } catch (error) {
    console.error("check-user failed:", error);
    return fail(500, "SERVER_ERROR", "Something went wrong. Please try again.");
  }
}