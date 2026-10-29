import { signInWithEmailAndPassword } from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import { mapFirebaseAuthError } from "@/lib/validations";

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

  const email = (body?.email ?? "").trim();
  const password = body?.password ?? "";

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

  // ── Authenticate via Firebase Auth ───────────────────────────────────────
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(
      auth,
      email.toLowerCase(),
      password
    );
  } catch (err) {
    const mapped = mapFirebaseAuthError(err.code);
    return Response.json(
      {
        success: false,
        code: mapped.code,
        message: mapped.message,
      },
      { status: mapped.status }
    );
  }

  const { user } = userCredential;
  const idToken = await user.getIdToken();
  const refreshToken = user.refreshToken || "";

  // ── Fetch user profile from RTDB to obtain role ──────────────────────────
  let role = "user";
  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      role = data.type || "user";
      // Update last seen
      await update(userRef, { lastSeen: Date.now(), active: true }).catch(() => {});
    }
  } catch (err) {
    console.error("RTDB user fetch error:", err);
  }

  // ── Set auth cookie in response header ───────────────────────────────────
  const cookieHeader = `vitality_token=${idToken}; Path=/; Max-Age=604800; SameSite=Lax`;

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        uid: user.uid,
        role,
        idToken,
        refreshToken,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieHeader,
      },
    }
  );
}

