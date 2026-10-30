"use client";

import { ArrowLeft, ArrowRight, RotateCcwKey } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useApp } from "@/lib/AppProvider";
import { confirmBackendSession } from "@/lib/client/api";
import { useSignupFlow } from "../SignupFlowProvider";

const CODE_LENGTH = 5;

export default function Page() {
  const router = useRouter();
  const { refreshSession } = useApp();
  const { pendingSignup, setPendingSignup } = useSignupFlow();
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inputsRef = useRef([]);
  const isComplete = digits.every(Boolean);

  const focusAt = (index) => inputsRef.current[index]?.focus();

  function handleChange(index, event) {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    setDigits((previous) =>
      previous.map((digit, position) => (position === index ? value : digit)),
    );
    setError("");
    if (value && index < CODE_LENGTH - 1) focusAt(index + 1);
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    setDigits(
      Array.from({ length: CODE_LENGTH }, (_, index) => pasted[index] ?? ""),
    );
    focusAt(Math.min(pasted.length, CODE_LENGTH - 1));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!pendingSignup || !isComplete) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingSignup,
          verificationCode: digits.join(""),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.message ?? "The code could not be verified.");
        if (
          result.code === "INVALID_VERIFICATION_CODE" ||
          result.code === "VERIFICATION_CODE_NOT_FOUND" ||
          result.code === "VERIFICATION_CODE_EXPIRED" ||
          result.code === "VERIFICATION_CODE_LOCKED"
        ) {
          setDigits(Array(CODE_LENGTH).fill(""));
          if (result.code !== "INVALID_VERIFICATION_CODE") focusAt(0);
        }
        return;
      }

      await confirmBackendSession();
      if (!(await refreshSession())) {
        throw new Error("The new account session could not be loaded.");
      }
      setPendingSignup(null);
      router.replace("/home");
      router.refresh();
    } catch (submitError) {
      console.error("Signup verification failed:", submitError);
      setError("We couldn't complete signup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingSignup) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/signup/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingSignup.email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.code === "VALIDATION_ERROR" && result.errors) {
          setError(Object.values(result.errors).join(" "));
        } else {
          setError(result.message ?? "The code could not be verified.");
        }

        return;
      }
      setDigits(Array(CODE_LENGTH).fill(""));
      setMessage("A new verification code was sent to your email.");
    } catch (resendError) {
      console.error("Signup verification resend failed:", resendError);
      setError("We couldn't send another code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  function changeSignupDetails() {
    setPendingSignup(null);
    router.push("/signup");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[200px] -top-[100px] size-[600px] rounded-full bg-[radial-gradient(circle,var(--accent)_0%,transparent_70%)] opacity-70"
      />

      <div className="relative flex w-full max-w-[420px] flex-col gap-8">
        <div className="flex justify-center pb-2">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-accent shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <RotateCcwKey className="size-5 text-primary" aria-hidden="true" />
          </div>
        </div>

        <section className="flex flex-col gap-6 rounded-[20px] border border-border bg-surface p-8 text-surface-foreground shadow-[0_10px_16px_rgba(15,23,42,0.1)]">
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-medium leading-8 tracking-[-0.01em]">
              Email verification
            </h1>
            <div className="flex flex-col gap-1 text-sm leading-5 tracking-[0.02em]">
              <p>We sent a verification code to</p>
              <p className="break-all text-primary">
                {pendingSignup?.email ?? "your email"}
              </p>
            </div>
          </header>

          {!pendingSignup ? (
            <div className="flex flex-col gap-4 text-center">
              <p role="alert" className="text-sm text-red-500">
                Your signup details are no longer available. Please start again.
              </p>
              <Link
                href="/signup"
                className="flex h-14 w-full items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
              >
                Back to signup
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-6 pb-4"
            >
              <div
                className="flex w-full items-center justify-between"
                onPaste={handlePaste}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    placeholder="-"
                    aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                    onChange={(event) => handleChange(index, event)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Backspace" &&
                        !digits[index] &&
                        index > 0
                      ) {
                        focusAt(index - 1);
                      }
                      if (event.key === "ArrowLeft" && index > 0) {
                        focusAt(index - 1);
                      }
                      if (
                        event.key === "ArrowRight" &&
                        index < CODE_LENGTH - 1
                      ) {
                        focusAt(index + 1);
                      }
                    }}
                    onFocus={(event) => event.target.select()}
                    className="size-11 rounded border border-primary bg-primary/15 text-center font-[family-name:var(--font-poppins)] text-base text-foreground outline-none placeholder:text-foreground focus:ring-2 focus:ring-primary/40"
                  />
                ))}
              </div>

              {error && (
                <p
                  role="alert"
                  className="w-full text-center text-sm text-red-500"
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  role="status"
                  className="w-full text-center text-sm text-green-600"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={!isComplete || loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold tracking-[0.04em] text-primary-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Continue"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={changeSignupDetails}
                className="flex w-full items-center justify-center rounded-full border-[1.5px] border-primary px-8 py-3.5 text-base font-semibold leading-7 tracking-[0.05em] text-primary transition hover:bg-primary/10"
              >
                Change signup details
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm font-semibold leading-5 tracking-[0.02em] text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending ? "Sending..." : "Send another code"}
              </button>
            </form>
          )}
        </section>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium tracking-[0.04em] text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
