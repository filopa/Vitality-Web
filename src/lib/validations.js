// ─── Shared validation helpers ───────────────────────────────────────────────
// Used by route handlers so rules stay in one place.

/** Standard email format, case-insensitive */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
}

/**
 * Password strength:
 *  – 8+ characters
 *  – at least one digit
 *  – at least one special (non-alphanumeric) character
 */
export function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

/** Name: 2–50 non-empty characters */
export function isValidName(name) {
  const t = name.trim();
  return t.length >= 2 && t.length <= 50;
}

/**
 * Username:
 *  – lowercase letters, digits, underscore only
 *  – 3–30 characters
 */
export function isValidUsername(username) {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

/**
 * Map a Firebase Auth error code to the API contract error shape.
 * Returns { status, code, message }.
 */
export function mapFirebaseAuthError(firebaseCode) {
  switch (firebaseCode) {
    case "auth/email-already-in-use":
      return { status: 409, code: "EMAIL_EXISTS", message: "Email is already in use." };
    case "auth/weak-password":
      return { status: 400, code: "WEAK_PASSWORD", message: "Password is too weak." };
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return { status: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password." };
    case "auth/too-many-requests":
      return { status: 429, code: "TOO_MANY_REQUESTS", message: "Too many failed attempts. Please try again later." };
    case "auth/invalid-id-token":
    case "auth/id-token-expired":
      return { status: 401, code: "INVALID_TOKEN", message: "Authentication token is invalid or expired." };
    default:
      return { status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred." };
  }
}
