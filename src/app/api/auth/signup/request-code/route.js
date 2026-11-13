import { adminAuth, adminRTDB } from "@/lib/firebase-admin";
import { sendSignupVerificationCode } from "@/lib/server/signup-verification";
import { isValidEmail } from "@/lib/validations";

export async function POST(request) {
  let email;
  try {
    const body = await request.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { success: false, errors: { email: "Enter a valid email address." } },
      { status: 400 },
    );
  }

  try {
    let existingUser;
    try {
      existingUser = await adminAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }

    if (existingUser) {
      const profile = await adminRTDB.ref(`users/${existingUser.uid}`).get();
      const hasPasswordProvider = existingUser.providerData.some(
        (provider) => provider.providerId === "password",
      );
      if (!hasPasswordProvider || profile.exists()) {
        return Response.json(
          {
            success: false,
            code: "EMAIL_EXISTS",
            message: "This email is already registered.",
          },
          { status: 409 },
        );
      }
    }

    const result = await sendSignupVerificationCode(email);
    if (!result.sent) {
      return Response.json(
        {
          success: false,
          code: "RESEND_COOLDOWN",
          message: "Please wait before requesting another code.",
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to send signup verification code:", error);
    return Response.json(
      {
        success: false,
        code: "EMAIL_DELIVERY_FAILED",
        message: "We couldn't send the verification email. Please try again.",
      },
      { status: 503 },
    );
  }
}
