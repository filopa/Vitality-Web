"use client";

import {
  AtSign,
  CheckCircle2,
  Lock,
  Mail,
  MapPinHouse,
  Phone,
  User,
  Mars,
  Venus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { InputField } from "../_components/Inputfield";

// ─── Google Sign-in button ────────────────────────────────────────────────────

function GoogleButton({ loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface font-semibold text-surface-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {loading ? "Connecting with Google…" : "Continue with Google"}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-widest text-muted">
        or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter(); 
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Google connected user info: { uid, name, email, photoURL, idToken }
  const [googleUser, setGoogleUser] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

  // ── Google Connect ────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true);
    setServerError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      const idToken = await user.getIdToken();

      setGoogleUser({
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        avatarURL: user.photoURL || "",
        idToken,
      });

      setNameValue(user.displayName || "");
      setEmailValue(user.email || "");
      router.push("/home"); 
      // Clear previous field errors
      setFieldErrors({});
    } catch (err) {
      console.log("Google error:", err.code, err.message);
      if (err.code !== "auth/popup-closed-by-user") {
        setServerError("Google connection failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleDisconnectGoogle() {
    setGoogleUser(null);
    setNameValue("");
    setEmailValue("");
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const errs = {};
    const name = (data.get("name") ?? nameValue).trim();
    const username = (data.get("username") ?? "").trim();
    const email = (data.get("email") ?? emailValue).trim();
    const password = data.get("password") ?? "";
    const confirmPassword = data.get("confirmPassword") ?? "";
    const terms = data.get("terms");

    if (name.length < 2 || name.length > 50)
      errs.name = "Name must be 2–50 characters.";

    if (!/^[a-z0-9_]{3,30}$/.test(username))
      errs.username =
        "Username: 3–30 chars, lowercase letters, numbers, or underscores only.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address.";

    if (!googleUser) {
      if (
        password.length < 8 ||
        !/[0-9]/.test(password) ||
        !/[^A-Za-z0-9]/.test(password)
      )
        errs.password =
          "Password must be 8+ characters with a number and a special character.";

      if (password !== confirmPassword)
        errs.confirmPassword = "Passwords do not match.";
    }

    if (!gender) errs.gender = "Please select your gender.";
    if (!terms) errs.terms = "You must accept the terms and conditions.";

    setFieldErrors(errs);
    setServerError("");
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        phone: (data.get("phone") ?? "").trim(),
        country: (data.get("country") ?? "").trim(),
        gender,
        birthday: data.get("birthday") ?? "",
      };

      if (googleUser) {
        payload.googleUid = googleUser.uid;
        payload.photoURL = googleUser.photoURL;
        payload.idToken = googleUser.idToken;
      } else {
        payload.password = password;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.code === "VALIDATION_ERROR" && json.errors) {
          setFieldErrors((p) => ({ ...p, ...json.errors }));
        } else if (json.code === "EMAIL_EXISTS") {
          setFieldErrors((p) => ({
            ...p,
            email: "This email is already registered.",
          }));
        } else if (json.code === "WEAK_PASSWORD") {
          setFieldErrors((p) => ({
            ...p,
            password: "Password is too weak. Try a stronger one.",
          }));
        } else if (json.code === "TOO_MANY_REQUESTS") {
          setServerError(
            "Too many attempts. Please wait a moment and try again.",
          );
        } else {
          setServerError(
            json.message ?? "Something went wrong. Please try again.",
          );
        }
        return;
      }

      if (json.data?.idToken && typeof window !== "undefined") {
        localStorage.setItem("vitality_token", json.data.idToken);
        localStorage.setItem("vitality_user", JSON.stringify(json.data));
        document.cookie = `vitality_token=${json.data.idToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      router.push("/onboarding");
    } catch {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* If connected with Google, show connected indicator banner at top */}
      {googleUser && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt=""
                className="h-10 w-10 rounded-full border border-primary/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                {googleUser.name?.[0] || "G"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {googleUser.name}
                </p>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted">
                {googleUser.email} • Connected with Google
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDisconnectGoogle}
            className="flex items-center gap-1 text-xs font-medium text-muted hover:text-red-500"
            title="Use a different account or sign up with email"
          >
            <X className="h-4 w-4" />
            <span>Change</span>
          </button>
        </div>
      )}

      {/* Main normal signup form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* Username */}
          <InputField
            label="Username"
            name="username"
            icon={<AtSign className="h-5 w-5" />}
            placeholder="Choose a username"
            autoComplete="username"
            required
            error={fieldErrors.username}
          />

          {/* Name */}
          <InputField
            label="Name"
            name="name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            icon={<User className="h-5 w-5" />}
            placeholder="Enter your name"
            autoComplete="name"
            required
            error={fieldErrors.name}
          />

          {/* Email */}
          <InputField
            label="Email address"
            name="email"
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            readOnly={Boolean(googleUser)}
            icon={<Mail className="h-5 w-5" />}
            placeholder="Enter your email"
            autoComplete="email"
            required
            error={fieldErrors.email}
          />

          {/* Country */}
          <InputField
            label="Country"
            name="country"
            icon={<MapPinHouse className="h-5 w-5" />}
            placeholder="Enter your country"
            autoComplete="country"
          />

          {/* Phone */}
          <InputField
            label="Phone number"
            name="phone"
            type="tel"
            icon={<Phone className="h-5 w-5" />}
            placeholder="Enter your phone number"
            autoComplete="tel"
          />

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
              Gender
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                aria-pressed={gender === "male"}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                  gender === "male"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-primary"
                }`}
              >
                <Mars className="h-5 w-5" />
                <span>Male</span>
              </button>

              <button
                type="button"
                onClick={() => setGender("female")}
                aria-pressed={gender === "female"}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                  gender === "female"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-primary"
                }`}
              >
                <Venus className="h-5 w-5" />
                <span>Female</span>
              </button>
            </div>

            <input type="hidden" name="gender" value={gender} />

            {fieldErrors.gender && (
              <p role="alert" className="text-sm text-red-500">
                {fieldErrors.gender}
              </p>
            )}
          </div>

          {/* Birthday */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="birthday"
              className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted"
            >
              Birthday
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-surface-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </div>

          {/* Passwords only shown if not using Google */}
          {!googleUser && (
            <>
              <InputField
                label="Password"
                name="password"
                type="password"
                revealable
                icon={<Lock className="h-5 w-5" />}
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={8}
                required
                error={fieldErrors.password}
              />

              <InputField
                label="Confirm password"
                name="confirmPassword"
                type="password"
                revealable
                icon={<Lock className="h-5 w-5" />}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                error={fieldErrors.confirmPassword}
              />
            </>
          )}

          {/* Terms */}
          <div className="flex flex-col gap-1">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="terms"
                value="accepted"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              />
              <span className="text-sm leading-5 text-muted">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="font-semibold text-primary hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="font-semibold text-primary hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {fieldErrors.terms && (
              <p role="alert" className="text-sm text-red-500">
                {fieldErrors.terms}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="h-14 w-full rounded-full bg-primary font-button text-xl font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      {/* Google button BELOW the normal signup */}
      {!googleUser && (
        <div className="flex flex-col gap-6">
          <OrDivider />
          <GoogleButton loading={googleLoading} onClick={handleGoogle} />
        </div>
      )}
    </div>
  );
}
