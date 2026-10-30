import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import {
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
  resolveCountryCode,
} from "@/lib/phone";
import {
  mapIdentityToolkitError,
  requestIdentityToolkit,
} from "@/lib/server/identity-toolkit";
import { createSessionResponse } from "@/lib/server/session";
import {
  clearSignupVerificationCode,
  verifySignupVerificationCode,
} from "@/lib/server/signup-verification";
import {
  isStrongPassword,
  isValidEmail,
  isValidName,
  isValidUsername,
  mapFirebaseAuthError,
  USERNAME_ERROR_MESSAGE,
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
    requestedType,
    googleUid,
    photoURL,
    idToken: clientToken,
    verificationCode,
  } = body;

  const isGoogleSignup = Boolean(clientToken);
  const validRequestedTypes = ["user", "doctor"];

  if (!validRequestedTypes.includes(requestedType)) {
    return Response.json(
      {
        success: false,
        code: "INVALID_REQUESTED_TYPE",
        message: "Please select a valid account type.",
      },
      { status: 400 },
    );
  }

  let googleClaims = null;
  if (isGoogleSignup) {
    try {
      googleClaims = await adminAuth.verifyIdToken(clientToken, true);
    } catch {
      return Response.json(
        { success: false, code: "INVALID_TOKEN", message: "Google sign-up could not be verified." },
        { status: 401 },
      );
    }

    if (
      googleClaims.firebase?.sign_in_provider !== "google.com" ||
      googleClaims.uid !== googleUid ||
      googleClaims.email_verified !== true ||
      googleClaims.email?.toLowerCase() !== email.toLowerCase()
    ) {
      return Response.json(
        { success: false, code: "INVALID_GOOGLE_ACCOUNT", message: "Google account details could not be verified." },
        { status: 401 },
      );
    }
  }
  // ── Field validation ─────────────────────────────────────────────────────
  const errors = {};
  const normalizedCountry = resolveCountryCode(country);
  const normalizedPhone = phone ? getPhoneE164(phone, normalizedCountry) : "";

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
    errors.username = USERNAME_ERROR_MESSAGE;
  if (phone && !normalizedCountry)
    errors.country = "Select a valid country for your phone number.";
  if (phone && normalizedCountry && !normalizedPhone)
    errors.phone = PHONE_VALIDATION_ERROR;

  if (Object.keys(errors).length > 0) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", errors },
      { status: 400 }
    );
  }

  if (!isGoogleSignup) {
    const verification = await verifySignupVerificationCode(
      email.toLowerCase().trim(),
      verificationCode,
    );
    if (!verification.valid) {
      const failures = {
        invalid_format: {
          code: "INVALID_VERIFICATION_CODE",
          message: "Enter the 5-digit code from the latest email.",
        },
        not_found: {
          code: "VERIFICATION_CODE_NOT_FOUND",
          message: "No active code was found for this email. Request a new code.",
        },
        expired: {
          code: "VERIFICATION_CODE_EXPIRED",
          message: "This code has expired. Request a new code and try again.",
        },
        too_many_attempts: {
          code: "VERIFICATION_CODE_LOCKED",
          message: "Too many incorrect attempts. Request a new code to continue.",
        },
        incorrect: {
          code: "INVALID_VERIFICATION_CODE",
          message: "That code doesn't match. Check the latest email and try again.",
        },
      };
      const failure = failures[verification.reason] ?? failures.not_found;
      console.warn("Signup verification rejected:", failure.code);
      return Response.json(
        { success: false, ...failure },
        { status: failure.code === "VERIFICATION_CODE_LOCKED" ? 429 : 400 },
      );
    }
  }

  let finalUid = googleClaims?.uid ?? "";
  let finalToken = clientToken ?? "";

  if (isGoogleSignup) {
    const existingSnap = await adminRTDB.ref(`users/${finalUid}`).get();
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
    let identityResult;
    try {
      identityResult = await requestIdentityToolkit("accounts:signUp", {
        email: email.toLowerCase().trim(),
        password,
        returnSecureToken: true,
      });
    } catch (err) {
      console.error("Firebase account creation request failed:", err);
      return Response.json(
        { success: false, code: "AUTH_SERVICE_UNAVAILABLE", message: "Sign-up is temporarily unavailable." },
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

    finalUid = identityResult.data.localId;
    finalToken = identityResult.data.idToken;
    try {
      await adminAuth.updateUser(finalUid, {
        displayName: name.trim(),
        emailVerified: true,
      });
      const verifiedIdentityResult = await requestIdentityToolkit(
        "accounts:signInWithPassword",
        {
          email: email.toLowerCase().trim(),
          password,
          returnSecureToken: true,
        },
      );
      if (!verifiedIdentityResult.ok) {
        throw new Error(
          `Could not create a verified signup token: ${verifiedIdentityResult.code}`,
        );
      }
      finalToken = verifiedIdentityResult.data.idToken;
    } catch (err) {
      console.error("Firebase account profile update failed:", err);
      await adminAuth.deleteUser(finalUid).catch((deleteError) => {
        console.error("Failed to roll back Firebase account creation:", deleteError);
      });
      return Response.json(
        { success: false, code: "ACCOUNT_SETUP_FAILED", message: "We couldn't finish creating your account." },
        { status: 500 },
      );
    }
  }

  // ── Write RTDB user record ───────────────────────────────────────────────
  const userRecord = {
    uid: finalUid,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    phone: normalizedPhone,
    country: normalizedCountry || country || "",
    gender: gender ?? "",
    birthday: birthday ?? "",
    bio: "",
    photoURL: googleClaims?.picture ?? photoURL ?? "",
    avatarURL: googleClaims?.picture ?? photoURL ?? "",
    type: "user",
    requestedType: requestedType ?? "",
    active: true,
    lastSeen: Date.now(),
    family: {},
  };

  try {
    await adminRTDB.ref(`users/${finalUid}`).set(userRecord);
    const response = await createSessionResponse(
      finalToken,
      {
        name: userRecord.name,
        email: userRecord.email,
        requestedType: userRecord.requestedType,
        role: userRecord.type,
      },
      201,
    );
    if (!isGoogleSignup) {
      try {
        await clearSignupVerificationCode(email);
      } catch (error) {
        console.error("Failed to clear consumed signup verification code:", error);
      }
    }
    return response;
  } catch (err) {
    console.error("Failed to create signup session:", err);
    if (!isGoogleSignup) {
      await adminRTDB.ref(`users/${finalUid}`).remove().catch((deleteError) => {
        console.error("Failed to roll back RTDB profile creation:", deleteError);
      });
      await adminAuth.deleteUser(finalUid).catch((deleteError) => {
        console.error("Failed to roll back Firebase account creation:", deleteError);
      });
    }
    return Response.json(
      { success: false, code: "SESSION_CREATION_FAILED", message: "We couldn't create your session. Please try again." },
      { status: 500 },
    );
  }
}
