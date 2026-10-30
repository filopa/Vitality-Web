"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
      {loading ? "Signing in with Google…" : "Continue with Google"}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-widest text-muted">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Login Form Component ─────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/feed";

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // ── Email/Password Submit ──────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const email = (data.get("email") ?? "").trim();
    const password = data.get("password") ?? "";

    // Client-side quick checks
    const errs = {};
    if (!email) {
      errs.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }

    if (!password) {
      errs.password = "Please enter your password.";
    }

    setFieldErrors(errs);
    setServerError("");
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.code === "INVALID_CREDENTIALS") {
          // General error message without revealing which field was incorrect
          setServerError("Invalid email or password. Please try again.");
        } else if (json.code === "TOO_MANY_REQUESTS") {
          setServerError("Too many failed attempts. Please wait a few minutes before trying again.");
        } else if (json.code === "VALIDATION_ERROR" && json.errors) {
          setFieldErrors(json.errors);
        } else {
          setServerError(json.message ?? "An error occurred while logging in. Please try again.");
        }
        return;
      }

      // Success: Save token & session
      if (json.data?.idToken && typeof window !== "undefined") {
        localStorage.setItem("vitality_token", json.data.idToken);
        localStorage.setItem("vitality_user", JSON.stringify(json.data));
        document.cookie = `vitality_token=${json.data.idToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      // Redirect to destination
      router.push(redirectPath);
      router.refresh();
    } catch {
      setServerError("Network error. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Google Sign In ────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true);
    setServerError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user } = result;
      const idToken = await user.getIdToken();

      const res = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          idToken,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setServerError(json.message ?? "Google sign-in failed. Please try again.");
        return;
      }

      if (idToken && typeof window !== "undefined") {
        localStorage.setItem("vitality_token", idToken);
        localStorage.setItem("vitality_user", JSON.stringify(json.data));
        document.cookie = `vitality_token=${idToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      // New Google users go to onboarding; existing users go to feed/redirect
      if (json.data.isNew) {
        router.push("/onboarding");
      } else {
        router.push(redirectPath);
      }
      router.refresh();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setServerError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Main Email/Password Login Form ──────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {serverError}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {/* Email */}
          <InputField
            label="Email address"
            name="email"
            type="email"
            icon={<Mail className="h-5 w-5" />}
            placeholder="Enter your email"
            autoComplete="email"
            required
            error={fieldErrors.email}
          />

          {/* Password with Forgot Password link */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
                Password
              </span>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <InputField
              name="password"
              type="password"
              revealable
              icon={<Lock className="h-5 w-5" />}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              error={fieldErrors.password}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 h-14 w-full rounded-full bg-primary font-button text-xl font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      {/* ── Google Option BELOW Normal Form ─────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <OrDivider />
        <GoogleButton loading={googleLoading} onClick={handleGoogle} />
      </div>
    </div>
  );
}

