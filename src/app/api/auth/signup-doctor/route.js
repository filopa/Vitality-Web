import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import {
  mapIdentityToolkitError,
  requestIdentityToolkit,
} from "@/lib/server/identity-toolkit";
import { createSessionResponse } from "@/lib/server/session";
import {
  isValidEmail,
  isStrongPassword,
  isValidName,
  isValidUsername,
  USERNAME_ERROR_MESSAGE,
  mapFirebaseAuthError,
} from "@/lib/validations";

// ─── POST /api/auth/signup-doctor ────────────────────────────────────────────
//
// Expects multipart/form-data:
//   name, email, password, username, phone, country, gender, birthday,
//   specialty, licenseNumber,
//   licenseIssuer   (string – institution that issued the license)
//   licenseYear     (4-digit year)
//   licenseDoc      (File – required)
//   degreeIssuer    (string – optional)
//   degreeYear      (4-digit year – optional)
//   degreeDoc       (File – optional)
//   googleUid       (string – optional if signed in with Google)
//   photoURL        (string – optional from Google)
//
// RTDB layout written directly:
//   users/{uid}                               → doctor profile (type:"doctor", verified:false)
//   doctorCertificates/{uid}/{certId}         → certificate records (mediaUrl: array)

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const name           = (formData.get("name")          ?? "").trim();
  const email          = (formData.get("email")         ?? "").trim().toLowerCase();
  const password       =  formData.get("password")      ?? "";
  const username       = (formData.get("username")      ?? "").trim().toLowerCase();
  const phone          = (formData.get("phone")         ?? "").trim();
  const country        = (formData.get("country")       ?? "").trim();
  const gender         = (formData.get("gender")        ?? "").trim();
  const birthday       = (formData.get("birthday")      ?? "").trim();
  const specialty      = (formData.get("specialty")     ?? "").trim();
  const licenseNum     = (formData.get("licenseNumber") ?? "").trim();
  const licenseIssuer  = (formData.get("licenseIssuer") ?? "").trim();
  const licenseYear    =  parseInt(formData.get("licenseYear") ?? "0", 10);
  const licenseDoc     =  formData.get("licenseDoc");      // File | null
  const degreeIssuer   = (formData.get("degreeIssuer")  ?? "").trim();
  const degreeYear     =  parseInt(formData.get("degreeYear")  ?? "0", 10);
  const degreeDoc      =  formData.get("degreeDoc");       // File | null
  const googleUid      = (formData.get("googleUid")     ?? "").trim();
  const photoURL       = (formData.get("photoURL")      ?? "").trim();
  const clientToken    = (formData.get("idToken")       ?? "").trim();

  const isGoogleSignup = Boolean(clientToken);
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
      googleClaims.email?.toLowerCase() !== email
    ) {
      return Response.json(
        { success: false, code: "INVALID_GOOGLE_ACCOUNT", message: "Google account details could not be verified." },
        { status: 401 },
      );
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────
  const errors = {};

  if (!isValidName(name))
    errors.name = "Name must be between 2 and 50 characters.";

  if (!isValidEmail(email))
    errors.email = "A valid email address is required.";

  if (!isGoogleSignup) {
    if (!password) {
      errors.password = "Password is required.";
    } else if (!isStrongPassword(password)) {
      errors.password =
        "Password must be at least 8 characters and include a number and a special character.";
    }
  }

  if (!isValidUsername(username))
    errors.username = USERNAME_ERROR_MESSAGE;

  if (!specialty || specialty.length < 2)
    errors.specialty = "Medical specialty is required.";

  if (!licenseNum || licenseNum.length < 3)
    errors.licenseNumber = "License number is required.";

  if (!licenseIssuer || licenseIssuer.length < 2)
    errors.licenseIssuer = "Issuing institution is required.";

  const currentYear = new Date().getFullYear();
  if (!licenseYear || licenseYear < 1950 || licenseYear > currentYear)
    errors.licenseYear = `Issue year must be between 1950 and ${currentYear}.`;

  if (!licenseDoc || !(licenseDoc instanceof File) || licenseDoc.size === 0)
    errors.licenseDoc = "A license document (PDF or image) is required.";

  if (Object.keys(errors).length > 0) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", errors },
      { status: 400 }
    );
  }

  let finalUid = googleClaims?.uid ?? "";
  let finalToken = clientToken;

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
        email,
        password,
        returnSecureToken: true,
      });
    } catch (err) {
      console.error("Firebase doctor account creation request failed:", err);
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
      await adminAuth.updateUser(finalUid, { displayName: name });
    } catch (err) {
      console.error("Firebase doctor account profile update failed:", err);
      await adminAuth.deleteUser(finalUid).catch((deleteError) => {
        console.error("Failed to roll back Firebase doctor account:", deleteError);
      });
      return Response.json(
        { success: false, code: "ACCOUNT_SETUP_FAILED", message: "We couldn't finish creating your account." },
        { status: 500 },
      );
    }
  }

  const now = Date.now();

  // ── Write RTDB records ────────────────────────────────────────────────────
  // 1) users/{uid} — doctor profile
  const doctorRecord = {
    uid: finalUid,
    name,
    email,
    username,
    phone,
    country,
    gender,
    birthday,
    bio: "",
    photoURL: googleClaims?.picture || photoURL || "",
    avatarURL: googleClaims?.picture || photoURL || "",
    type: "doctor",
    active: true,
    verified: false, // admin flips this to true after review
    verifiedAt: null,
    lastSeen: now,
    family: {},
    specialty,
    licenseNumber: licenseNum,
  };

  // 2) doctorCertificates/{uid}/{certId} — one record per document directly in RTDB
  const licenseCertId = crypto.randomUUID();
  const licenseTitle = (formData.get("licenseTitle") || `Medical License – ${specialty}`).trim().slice(0, 150);
  const licenseCert = {
    certId: licenseCertId,
    uid: finalUid,
    title: licenseTitle,
    issuer: licenseIssuer,
    issueYear: licenseYear,
    mediaUrl: licenseDoc instanceof File ? [licenseDoc.name] : [],
    isVerified: false,
    verificationStatus: "padding", // per DB schema: approved, padding, rejected
    createdAt: now,
  };

  const degreeCertId = (degreeDoc instanceof File && degreeDoc.size > 0) ? crypto.randomUUID() : null;
  const degreeTitle = (formData.get("degreeTitle") || "Medical Degree").trim().slice(0, 150);
  const degreeCert = degreeCertId
    ? {
        certId: degreeCertId,
        uid: finalUid,
        title: degreeTitle,
        issuer: degreeIssuer || "",
        issueYear: degreeYear || 0,
        mediaUrl: degreeDoc instanceof File ? [degreeDoc.name] : [],
        isVerified: false,
        verificationStatus: "padding", // per DB schema: approved, padding, rejected
        createdAt: now,
      }
    : null;

  try {
    const writes = [
      adminRTDB.ref(`users/${finalUid}`).set(doctorRecord),
      adminRTDB.ref(`doctorCertificates/${finalUid}/${licenseCertId}`).set(licenseCert),
    ];

    if (degreeCert) {
      writes.push(
        adminRTDB
          .ref(`doctorCertificates/${finalUid}/${degreeCertId}`)
          .set(degreeCert),
      );
    }

    await Promise.all(writes);
    return await createSessionResponse(
      finalToken,
      {
        name,
        email,
        role: "doctor",
        verified: false,
      },
      201,
    );
  } catch (err) {
    console.error("RTDB write error:", err);
    if (!isGoogleSignup) {
      await Promise.all([
        adminRTDB.ref(`users/${finalUid}`).remove(),
        adminRTDB.ref(`doctorCertificates/${finalUid}`).remove(),
        adminAuth.deleteUser(finalUid),
      ]).catch((rollbackError) => {
        console.error("Failed to roll back doctor signup:", rollbackError);
      });
    }
    return Response.json(
      { success: false, code: "SESSION_CREATION_FAILED", message: "We couldn't create your session. Please try again." },
      { status: 500 },
    );
  }
}
