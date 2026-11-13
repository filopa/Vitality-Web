import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import {
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
  resolveCountryCode,
} from "@/lib/phone";
import { authenticate } from "@/lib/server/api";
import { syncPublicProfile } from "@/lib/server/public-profiles";
import {
  claimSignupVerificationTicket,
  clearSignupVerificationCode,
  completeSignupVerificationTicket,
} from "@/lib/server/signup-verification";
import {
  isValidEmail,
  isValidName,
  isValidUsername,
  USERNAME_ERROR_MESSAGE,
} from "@/lib/validations";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const authenticated = await authenticate(request, { allowMissingProfile: true });
  if (authenticated.error) return authenticated.error;

  const { decoded } = authenticated;
  const {
    name,
    email,
    username,
    phone,
    country,
    gender,
    birthday,
    requestedType,
    verificationTicket,
  } = body ?? {};
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedUsername = String(username ?? "").trim().toLowerCase();
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedGender =
    typeof gender === "string" ? gender.trim().toLowerCase() : "";
  const normalizedBirthday =
    typeof birthday === "string" ? birthday.trim() : "";
  const normalizedCountry = resolveCountryCode(
    typeof country === "string" ? country : "",
  );
  const normalizedPhone =
    typeof phone === "string" && phone
      ? getPhoneE164(phone, normalizedCountry)
      : "";

  const errors = {};
  if (!normalizedName || !isValidName(normalizedName)) {
    errors.name = "Name must be between 2 and 50 characters.";
  }
  if (!isValidEmail(normalizedEmail) || normalizedEmail !== decoded.email?.toLowerCase()) {
    errors.email = "The signup email must match the authenticated Firebase account.";
  }
  if (!isValidUsername(normalizedUsername)) {
    errors.username = USERNAME_ERROR_MESSAGE;
  }
  if (!["user", "doctor"].includes(requestedType)) {
    errors.requestedType = "Please select a valid account type.";
  }
  if (!["male", "female"].includes(normalizedGender)) {
    errors.gender = "Please select a valid gender.";
  }
  if (phone && !normalizedCountry) {
    errors.country = "Select a valid country for your phone number.";
  }
  if (phone && normalizedCountry && !normalizedPhone) {
    errors.phone = PHONE_VALIDATION_ERROR;
  }
  if (
    typeof verificationTicket !== "string" ||
    verificationTicket.length < 32 ||
    decoded.firebase?.sign_in_provider !== "password"
  ) {
    errors.verificationTicket = "Verify your email address before creating an account.";
  }

  if (Object.keys(errors).length) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", errors },
      { status: 400 },
    );
  }

  const uid = decoded.uid;
  const userRef = adminRTDB.ref(`users/${uid}`);
  try {
    const existingSnapshot = await userRef.get();
    if (existingSnapshot.exists()) {
      const existing = existingSnapshot.val();
      if (existing.email?.toLowerCase() !== normalizedEmail) {
        return Response.json(
          {
            success: false,
            code: "PROFILE_CONFLICT",
            message: "This account already has a profile.",
          },
          { status: 409 },
        );
      }

      await syncPublicProfile(uid);
      return Response.json({ success: true, data: { uid, isNew: false } });
    }

    const ticketValid = await claimSignupVerificationTicket(
      verificationTicket,
      normalizedEmail,
      uid,
    );
    if (!ticketValid) {
      return Response.json(
        {
          success: false,
          code: "INVALID_VERIFICATION_TICKET",
          message: "The email verification has expired. Request a new code.",
        },
        { status: 403 },
      );
    }

    const usernameMatches = await adminRTDB
      .ref("users")
      .orderByChild("username")
      .equalTo(normalizedUsername)
      .limitToFirst(2)
      .get();
    if (usernameMatches.exists()) {
      return Response.json(
        {
          success: false,
          code: "USERNAME_TAKEN",
          message: "This username is already in use.",
          errors: { username: "This username is already in use." },
        },
        { status: 409 },
      );
    }

    await adminAuth.updateUser(uid, {
      displayName: normalizedName,
      emailVerified: true,
    });

    const userRecord = {
      uid,
      name: normalizedName,
      email: normalizedEmail,
      username: normalizedUsername,
      phone: normalizedPhone,
      country:
        normalizedCountry || (typeof country === "string" ? country.trim() : ""),
      gender: normalizedGender,
      birthday: normalizedBirthday,
      bio: "",
      photoURL: decoded.picture ?? "",
      avatarURL: decoded.picture ?? "",
      type: "user",
      requestedType,
      active: true,
      lastSeen: Date.now(),
      family: {},
    };

    let created = false;
    const transaction = await userRef.transaction((current) => {
      if (current) return current;
      created = true;
      return userRecord;
    });
    if (!transaction.snapshot.exists()) {
      throw new Error("Could not save the authenticated user's profile.");
    }

    const savedProfile = transaction.snapshot.val();
    if (savedProfile.email?.toLowerCase() !== normalizedEmail) {
      return Response.json(
        { success: false, code: "PROFILE_CONFLICT", message: "This account already has a profile." },
        { status: 409 },
      );
    }

    await syncPublicProfile(uid);
    await clearSignupVerificationCode(normalizedEmail);
    await completeSignupVerificationTicket(verificationTicket);

    return Response.json(
      { success: true, data: { uid, isNew: created } },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Firebase-authenticated signup profile creation failed:", error);
    return Response.json(
      {
        success: false,
        code: "ACCOUNT_SETUP_FAILED",
        message: "We couldn't finish creating your account. Please try again.",
      },
      { status: 500 },
    );
  }
}
