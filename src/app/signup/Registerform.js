"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  AtSign,
  CheckCircle2,
  Lock,
  Mail,
  Mars,
  Stethoscope,
  User,
  UserRound,
  Venus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/AppProvider";
import { confirmBackendSession } from "@/lib/client/api";
import { auth } from "@/lib/firebase";
import {
  formatLocalPhone,
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
} from "@/lib/phone";
import { isValidUsername, USERNAME_ERROR_MESSAGE } from "@/lib/validations";
import { InputField } from "../_components/Inputfield";
import { CountryPhoneField } from "../_components/profile/CountryPhoneField";
import { useSignupFlow } from "./SignupFlowProvider";

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
  const { refreshSession } = useApp();
  const { setPendingSignup } = useSignupFlow();
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [type, setType] = useState("user");
  const [birthday, setBirthday] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameRequestRef = useRef(0);

  function handleCountryChange(nextCountry) {
    const formattedPhone = formatLocalPhone(phone, nextCountry);
    setCountry(nextCountry);
    setPhone(formattedPhone);
    setFieldErrors((previous) => ({
      ...previous,
      country: undefined,
      phone:
        formattedPhone && !getPhoneE164(formattedPhone, nextCountry)
          ? PHONE_VALIDATION_ERROR
          : undefined,
    }));
  }

  function handlePhoneChange(nextPhone) {
    setPhone(nextPhone);
    if (!nextPhone || getPhoneE164(nextPhone, country)) {
      setFieldErrors((previous) => ({ ...previous, phone: undefined }));
    }
  }

  useEffect(() => {
    const value = username.trim().toLowerCase();

    if (!value) {
      usernameRequestRef.current++;
      setUsernameStatus(null);
      setSuggestions([]);
      setCheckingUsername(false);
      return;
    }

    if (!isValidUsername(value)) {
      usernameRequestRef.current++;
      setUsernameStatus(null);
      setSuggestions([]);
      setCheckingUsername(false);
      setFieldErrors((prev) => ({ ...prev, username: USERNAME_ERROR_MESSAGE }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, username: undefined }));
    setUsernameStatus(null);
    setSuggestions([]);
    setCheckingUsername(true);

    const requestId = ++usernameRequestRef.current;

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/auth/username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: value,
            name: nameValue,
            birthDate: birthday,
          }),
        });

        const result = await response.json();

        // Ignore outdated responses
        if (requestId !== usernameRequestRef.current) return;

        if (!response.ok) {
          throw new Error(result.error || "Unable to check username");
        }

        setUsernameStatus(result.available);
        setSuggestions(result.suggestions || []);
      } catch (error) {
        if (requestId !== usernameRequestRef.current) return;

        setUsernameStatus("error");
        console.error("Username check failed:", error);
      } finally {
        if (requestId === usernameRequestRef.current) {
          setCheckingUsername(false);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [username, nameValue, birthday]);

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
      // Clear previous field errors
      setFieldErrors({});
    } catch (err) {
      console.log("Google error:", err.code, err.message);
      if (err.code !== "auth/popup-closed-by-user") {
        setServerError("Google connection failed. Please try again.");
      }
    } finally {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error("Firebase sign-out failed:", signOutError);
        setGoogleUser(null);
        setServerError("Google sign-out failed. Please try again.");
      }
      setGoogleLoading(false);
    }
  }

  function handleDisconnectGoogle() {
    setGoogleUser(null);
    setNameValue("");
    setEmailValue("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    let destination = null;

    const errs = {};
    const name = (data.get("name") ?? nameValue).trim();
    const username = (data.get("username") ?? "").trim();
    const email = (data.get("email") ?? emailValue).trim();
    const password = data.get("password") ?? "";
    const confirmPassword = data.get("confirmPassword") ?? "";
    const terms = data.get("terms");
    if (!isValidUsername(username)) {
      setFieldErrors((prev) => ({
        ...prev,
        username: USERNAME_ERROR_MESSAGE,
      }));
      return;
    }

    if (checkingUsername || usernameStatus !== true) {
      setFieldErrors((prev) => ({
        ...prev,
        username: "Please enter an available username.",
      }));
      return;
    }
    if (name.length < 2 || name.length > 50)
      errs.name = "Name must be 2–50 characters.";

    if (!isValidUsername(username.toLowerCase()))
      errs.username = USERNAME_ERROR_MESSAGE;

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
    const phoneE164 = phone ? getPhoneE164(phone, country) : "";
    if (phone && !country) errs.country = "Select a country for your phone number.";
    if (phone && country && !phoneE164) errs.phone = PHONE_VALIDATION_ERROR;

    setFieldErrors(errs);
    setServerError("");
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        phone: phoneE164,
        country,
        gender,
        requestedType: type,
        birthday: data.get("birthday") ?? "",
      };

      if (googleUser) {
        payload.googleUid = googleUser.uid;
        payload.photoURL = googleUser.photoURL;
        payload.idToken = googleUser.idToken;
      } else {
        payload.password = password;

        const verificationResponse = await fetch(
          "/api/auth/signup/request-code",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: payload.email }),
          },
        );
        const verificationResult = await verificationResponse.json();
        if (!verificationResponse.ok || !verificationResult.success) {
          if (verificationResult.code === "EMAIL_EXISTS") {
            setFieldErrors((previous) => ({
              ...previous,
              email: "This email is already registered.",
            }));
          } else {
            setServerError(
              verificationResult.message ??
                "We couldn't send the verification code. Please try again.",
            );
          }
          return;
        }

        setPendingSignup(payload);
        router.push("/signup/check-code");
        return;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
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

      await confirmBackendSession();
      if (!(await refreshSession())) {
        throw new Error("The server session could not be loaded.");
      }

      destination = "/home";
    } catch {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      if (googleUser) {
        await signOut(auth).catch(async (signOutError) => {
          console.error("Firebase sign-out failed:", signOutError);
          destination = null;
          setServerError("Google sign-out failed. Please try again.");
          await fetch("/api/auth/session", {
            method: "DELETE",
            credentials: "same-origin",
          }).catch((logoutError) => {
            console.error("Backend sign-out after Firebase failure failed:", logoutError);
          });
        });
      }
      setSubmitting(false);
    }

    if (destination) {
      router.push(destination);
      router.refresh();
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

          {/* Type */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
              Type
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("user")}
                aria-pressed={type === "user"}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                  type === "user"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-primary"
                }`}
              >
                <UserRound className="h-5 w-5" />
                <span>User</span>
              </button>

              <button
                type="button"
                onClick={() => setType("doctor")}
                aria-pressed={type === "doctor"}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                  type === "doctor"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted hover:border-primary"
                }`}
              >
                <Stethoscope className="h-5 w-5" />
                <span>Doctor</span>
              </button>
            </div>

            <input type="hidden" name="type" value={type} />

            {fieldErrors.type && (
              <p role="alert" className="text-sm text-red-500">
                {fieldErrors.type}
              </p>
            )}
          </div>



          {/* Username */}
          <InputField
            label="Username"
            name="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setFieldErrors((prev) => ({ ...prev, username: undefined }));
            }}
            icon={<AtSign className="h-5 w-5" />}
            placeholder="Choose a username"
            autoComplete="username"
            required
            error={fieldErrors.username}
          />

          <div className="mb-[-15px] text-sm">
            {checkingUsername && (
              <p className="text-gray-500">Checking username availability...</p>
            )}

            {!checkingUsername && usernameStatus === true && (
              <p className="text-green-600">✓ Username is available</p>
            )}

            {!checkingUsername && usernameStatus === false && (
              <div className="text-red-500">
                <p>✕ Username is already taken.</p>

                {suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setUsername(item)}
                        className="rounded-full border px-3 py-1 hover:bg-gray-100"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {usernameStatus === "error" && (
              <p className="text-red-500">
                Unable to verify username. Please try again.
              </p>
            )}
          </div>
          {/* Name */}
          <InputField
            label="Name"
            name="name"
            value={nameValue}
            onChange={(e) => {
              setNameValue(e.target.value);
              setUsernameStatus(null);
              setSuggestions([]);
            }}
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

          <CountryPhoneField
            idPrefix="signup"
            country={country}
            phone={phone}
            onCountryChange={handleCountryChange}
            onPhoneChange={handlePhoneChange}
            countryError={fieldErrors.country}
            phoneError={fieldErrors.phone}
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
              value={birthday}
              onChange={(e) => {
                setBirthday(e.target.value);
                setUsernameStatus(null);
                setSuggestions([]);
              }}
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
