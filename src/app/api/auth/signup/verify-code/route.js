import {
  createSignupVerificationTicket,
  verifySignupVerificationCode,
} from "@/lib/server/signup-verification";
import { isValidEmail } from "@/lib/validations";

const verificationErrors = {
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

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return Response.json(
      { success: false, code: "VALIDATION_ERROR", message: "A valid email is required." },
      { status: 400 },
    );
  }

  try {
    const verification = await verifySignupVerificationCode(
      email,
      body?.verificationCode,
    );
    if (!verification.valid) {
      const failure =
        verificationErrors[verification.reason] ?? verificationErrors.not_found;
      console.warn("Signup verification rejected:", failure.code);
      return Response.json(
        { success: false, ...failure },
        { status: failure.code === "VERIFICATION_CODE_LOCKED" ? 429 : 400 },
      );
    }

    const verificationTicket = await createSignupVerificationTicket(email);
    return Response.json({ success: true, verificationTicket });
  } catch (error) {
    console.error("Could not verify signup code:", error);
    return Response.json(
      {
        success: false,
        code: "VERIFICATION_UNAVAILABLE",
        message: "We couldn't verify the code. Please try again.",
      },
      { status: 503 },
    );
  }
}
