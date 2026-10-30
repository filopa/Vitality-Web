import "server-only";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function requestIdentityToolkit(action, body) {
  if (!API_KEY) {
    throw new Error("Firebase Web API key is not configured on the server.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${action}?key=${encodeURIComponent(API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const result = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      code: result.error?.message?.split(" : ")[0] ?? "UNKNOWN_ERROR",
    };
  }

  return { ok: true, data: result };
}

export function mapIdentityToolkitError(code) {
  const authCodes = {
    EMAIL_EXISTS: "auth/email-already-in-use",
    INVALID_EMAIL: "auth/invalid-email",
    WEAK_PASSWORD: "auth/weak-password",
    TOO_MANY_ATTEMPTS_TRY_LATER: "auth/too-many-requests",
    INVALID_LOGIN_CREDENTIALS: "auth/invalid-credential",
    EMAIL_NOT_FOUND: "auth/user-not-found",
    INVALID_PASSWORD: "auth/wrong-password",
    USER_DISABLED: "auth/user-disabled",
  };

  return authCodes[code] ?? code;
}
