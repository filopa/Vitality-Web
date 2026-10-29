"use client";

import { CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { InputField } from "../Componnet/Inputfield";
import ThemeToggle from "../theme-toggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSent(true);
    } catch {
      // For security, still show generic friendly error or confirm
      setError("Unable to send reset email. Please ensure the email is correct.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-5 pb-6 pt-12 font-brand text-foreground md:px-8 md:pb-12">
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-[448px] flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </header>

        <section className="rounded-[20px] bg-surface p-6 shadow-sm md:p-10">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <h2 className="text-xl font-bold">Check your inbox</h2>
              <p className="text-sm text-muted">
                We sent a password reset link to <strong>{email}</strong>. Please check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <InputField
                label="Email address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-5 w-5" />}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="h-14 w-full rounded-full bg-primary font-button text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending link…" : "Send reset link"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to login</span>
              </Link>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

