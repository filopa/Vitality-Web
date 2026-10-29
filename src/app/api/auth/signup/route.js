import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import {
  isValidEmail,
  isStrongPassword,
  isValidName,
  isValidUsername,
  mapFirebaseAuthError,
} from "@/lib/validations";

// ─── POST /api/auth/signup ───────────────────────────────────────────────────

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

  const {
    name,
    email,
    password,
    username,
    phone,
    country,
    gender,
    birthday,
    googleUid,
    photoURL,
    idToken: clientToken,
  } = body;

  const isGoogleSignup = Boolean(googleUid);

  // ── Field validation ─────────────────────────────────────────────────────
  const errors = {};

  if (!name || !isValidName(name))
    errors.name = "Name must be between 2 and 50 characters.";

  if (!email || !isValidEmail(email))
    errors.email = "A valid email address is required.";

  // Password only required if NOT signed in with Google
  if (!isGoogleSignup) {
    if (!password) {
      errors.password = "Password is required.";
    } else if (!isStrongPassword(password)) {
      errors.password =
        "Password must be at least 8 characters and include a number and a special character.";
    }
  }

  if (!username || !isValidUsername(username))
    errors.username =
      "Username must be 3–30 characters, lowercase, and contain only letters, numbers, or underscores.";

  if (Object.keys(errors).length > 0) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", errors },
      { status: 400 }
    );
  }

  let finalUid = googleUid;
  let finalToken = clientToken || "";

  if (isGoogleSignup) {
    // Check if account already exists
    const existingSnap = await get(ref(rtdb, `users/${googleUid}`));
    if (existingSnap.exists()) {
      return Response.json(
        {
          success: false,
          code: "EMAIL_EXISTS",
          message: "An account with this Google profile already exists. Please log in.",
        },
        { status: 409 }
      );
    }
  } else {
    // ── Create Firebase Auth user for email/password ─────────────────────────
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );
    } catch (err) {
      const mapped = mapFirebaseAuthError(err.code);
      return Response.json(
        { success: false, code: mapped.code, message: mapped.message },
        { status: mapped.status }
      );
    }

    const { user } = userCredential;
    await updateProfile(user, { displayName: name.trim() });
    finalUid = user.uid;
    finalToken = await user.getIdToken();
  }

  // ── Write RTDB user record ───────────────────────────────────────────────
  const userRecord = {
    uid: finalUid,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    phone: phone ?? "",
    country: country ?? "",
    gender: gender ?? "",
    birthday: birthday ?? "",
    bio: "",
    urlAvatar: photoURL ?? "",
    urlProfile: photoURL ?? "",
    type: "user",
    active: true,
    lastSeen: Date.now(),
    family: {},
  };

  try {
    await set(ref(rtdb, `users/${finalUid}`), userRecord);
  } catch {
    if (!isGoogleSignup) {
      // Rollback newly created Firebase Auth account
      await auth.currentUser?.delete().catch(() => {});
    }
    return Response.json(
      { success: false, code: "INTERNAL_ERROR", message: "Failed to save user profile." },
      { status: 500 }
    );
  }

  return Response.json(
    {
      success: true,
      data: {
        uid: finalUid,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.type,
        idToken: finalToken,
      },
    },
    { status: 201 }
  );
}
