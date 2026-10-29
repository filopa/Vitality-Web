import { ref, get, set, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";

/**
 * POST /api/auth/google-signin
 *
 * Called after a successful client-side Google popup.
 * Body: { idToken, uid, name, email, photoURL }
 *
 * – If the user already exists in RTDB → update lastSeen only.
 * – If this is a new Google user → create a full RTDB record (type: "user").
 *
 * Response 200: { success, data: { uid, name, email, role, isNew, idToken } }
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

  const { uid, name, email, photoURL, idToken } = body;

  if (!uid || !email) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "uid and email are required." },
      { status: 400 }
    );
  }

  const userRef = ref(rtdb, `users/${uid}`);
  const snapshot = await get(userRef);

  let isNew = false;
  let role = "user";

  if (snapshot.exists()) {
    // ── Returning user: just bump lastSeen ──────────────────────────────
    const existing = snapshot.val();
    role = existing.type ?? "user";
    await update(userRef, { lastSeen: Date.now(), active: true });
  } else {
    // ── First-time Google user: create full record ───────────────────────
    isNew = true;
    const userRecord = {
      uid,
      name: name ?? "",
      email: email.toLowerCase(),
      username: "", // user completes in onboarding
      phone: "",
      country: "",
      gender: "",
      birthday: "",
      bio: "",
      urlAvatar: photoURL ?? "",
      urlProfile: photoURL ?? "",
      type: "user",
      active: true,
      lastSeen: Date.now(),
      family: {},
    };
    await set(userRef, userRecord);
  }

  const headers = { "Content-Type": "application/json" };
  if (idToken) {
    headers["Set-Cookie"] = `vitality_token=${idToken}; Path=/; Max-Age=604800; SameSite=Lax`;
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        uid,
        name: name ?? "",
        email: email.toLowerCase(),
        role,
        isNew,
        idToken: idToken || "",
      },
    }),
    {
      status: 200,
      headers,
    }
  );
}
