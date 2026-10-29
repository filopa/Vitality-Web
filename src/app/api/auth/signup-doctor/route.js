import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { get, ref as dbRef, set } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import {
  isValidEmail,
  isStrongPassword,
  isValidName,
  isValidUsername,
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

  const isGoogleSignup = Boolean(googleUid);

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
    errors.username =
      "Username must be 3–30 characters, lowercase, and contain only letters, numbers, or underscores.";

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

  let finalUid = googleUid;
  let finalToken = "";

  if (isGoogleSignup) {
    // Check if account already exists
    const existingSnap = await get(dbRef(rtdb, `users/${googleUid}`));
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
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const mapped = mapFirebaseAuthError(err.code);
      return Response.json(
        { success: false, code: mapped.code, message: mapped.message },
        { status: mapped.status }
      );
    }

    const { user } = userCredential;
    await updateProfile(user, { displayName: name });
    finalUid = user.uid;
    finalToken = await user.getIdToken();
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
    urlAvatar: photoURL || "",
    urlProfile: photoURL || "",
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
      set(dbRef(rtdb, `users/${finalUid}`), doctorRecord),
      set(dbRef(rtdb, `doctorCertificates/${finalUid}/${licenseCertId}`), licenseCert),
    ];

    if (degreeCert) {
      writes.push(set(dbRef(rtdb, `doctorCertificates/${finalUid}/${degreeCertId}`), degreeCert));
    }

    await Promise.all(writes);
  } catch (err) {
    console.error("RTDB write error:", err);
    if (!isGoogleSignup) {
      await auth.currentUser?.delete().catch(() => {});
    }
    return Response.json(
      { success: false, code: "INTERNAL_ERROR", message: "Failed to save doctor profile." },
      { status: 500 }
    );
  }

  return Response.json(
    {
      success: true,
      data: {
        uid: finalUid,
        name,
        email,
        role: "doctor",
        verified: false,
        idToken: finalToken,
      },
    },
    { status: 201 }
  );
}
