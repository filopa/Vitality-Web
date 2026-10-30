"use client";

import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  MapPinHouse,
  Phone,
  Stethoscope,
  Upload,
  User,
  Mars,
  Venus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { InputField } from "../../_components/Inputfield";

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
      <span className="text-xs font-medium uppercase tracking-widest text-muted">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── File drop zone ───────────────────────────────────────────────────────────

function FileDropZone({ label, name, required = false, accept, hint, error }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  function pick(files) {
    if (files?.[0]) setFile(files[0]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-primary bg-primary/5"
            : error
            ? "border-red-400 bg-red-50"
            : file
            ? "border-primary/50 bg-primary/5"
            : "border-border bg-surface hover:border-primary/50"
        }`}
      >
        {file ? (
          <>
            <FileText className="h-6 w-6 text-primary" />
            <span className="max-w-[200px] truncate text-sm font-medium text-surface-foreground">
              {file.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full p-1 text-muted hover:text-red-500"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted" />
            <span className="text-sm text-muted">
              <span className="font-semibold text-primary">Click to upload</span> or drag & drop
            </span>
            {hint && <span className="text-xs text-muted">{hint}</span>}
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        onChange={(e) => pick(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Doctor register form (Slider / Multi-Step) ───────────────────────────────

export function DoctorRegisterForm() {
  const router = useRouter();
  const formRef = useRef(null);

  // Slider step state: 1 (Personal & Account Info) or 2 (Verification Documents)
  const [step, setStep] = useState(1);

  // Dynamic height refs to eliminate empty whitespace
  const slide1Ref = useRef(null);
  const slide2Ref = useRef(null);
  const [sliderHeight, setSliderHeight] = useState(undefined);

  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Google connected info
  const [googleUser, setGoogleUser] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

  // Safe ceiling year for Next.js 16 SSR/prerender
  const [maxYear, setMaxYear] = useState(2026);
  useEffect(() => {
    setMaxYear(new Date().getFullYear());
  }, []);

  // Update container height dynamically to eliminate empty space
  useEffect(() => {
    const activeSlide = step === 1 ? slide1Ref.current : slide2Ref.current;
    if (!activeSlide) return;

    const updateHeight = () => {
      const h = activeSlide.offsetHeight;
      if (h > 0) setSliderHeight(h);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(activeSlide);
    return () => observer.disconnect();
  }, [step, googleUser, fieldErrors]);

  // Smooth scroll to top of form when switching steps
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [step]);

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
        idToken,
      });

      setNameValue(user.displayName || "");
      setEmailValue(user.email || "");
      setFieldErrors({});
    } catch (err) {
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

  // ── Validate Step 1 (Personal & Account Info) ──────────────────────────────
  function validateStep1(data) {
    const errs = {};
    const name     = (data.get("name")     ?? nameValue).trim();
    const username = (data.get("username") ?? "").trim();
    const email    = (data.get("email")    ?? emailValue).trim();
    const password =  data.get("password") ?? "";
    const confirm  =  data.get("confirmPassword") ?? "";

    if (name.length < 2 || name.length > 50) {
      errs.name = "Name must be 2–50 characters.";
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      errs.username = "Username: 3–30 chars, lowercase letters, numbers, or underscores only.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }

    if (!gender) {
      errs.gender = "Please select your gender.";
    }

    if (!googleUser) {
      if (password.length < 8 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        errs.password = "Password must be 8+ characters with a number and a special character.";
      }

      if (password !== confirm) {
        errs.confirmPassword = "Passwords do not match.";
      }
    }

    return errs;
  }

  // ── Slide to Next Step ────────────────────────────────────────────────────
  function handleNext(e) {
    e.preventDefault();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const step1Errors = validateStep1(data);

    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors(step1Errors);
      return;
    }

    // Clear step 1 errors and slide to step 2
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      delete next.username;
      delete next.email;
      delete next.password;
      delete next.confirmPassword;
      delete next.gender;
      return next;
    });

    setStep(2);
  }

  // ── Slide to Previous Step ────────────────────────────────────────────────
  function handleBack() {
    setStep(1);
  }

  // ── Form Submission ───────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!formRef.current) return;
    const data = new FormData(formRef.current);

    // Validate step 1 again in case user edited
    const step1Errors = validateStep1(data);
    if (Object.keys(step1Errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...step1Errors }));
      setStep(1);
      return;
    }

    // Validate step 2
    const errs = {};
    const specialty     = (data.get("specialty")     ?? "").trim();
    const licenseNum    = (data.get("licenseNumber") ?? "").trim();
    const licenseIssuer = (data.get("licenseIssuer") ?? "").trim();
    const licenseYear   = (data.get("licenseYear")   ?? "").trim();
    const licenseDoc    =  data.get("licenseDoc");
    const terms         =  data.get("terms");

    if (!specialty || specialty.length < 2) {
      errs.specialty = "Medical specialty is required.";
    }

    if (!licenseNum || licenseNum.length < 3) {
      errs.licenseNumber = "License number is required.";
    }

    if (!licenseIssuer || licenseIssuer.length < 2) {
      errs.licenseIssuer = "Issuing institution is required.";
    }

    const currentYear = new Date().getFullYear();
    const parsedYear = parseInt(licenseYear, 10);
    if (!parsedYear || parsedYear < 1950 || parsedYear > currentYear) {
      errs.licenseYear = `Issue year must be between 1950 and ${currentYear}.`;
    }

    if (!licenseDoc || !(licenseDoc instanceof File) || licenseDoc.size === 0) {
      errs.licenseDoc = "A license document is required.";
    }

    if (!terms) {
      errs.terms = "You must accept the terms and conditions.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errs }));
      return;
    }

    setSubmitting(true);
    setServerError("");

    data.set("gender", gender);
    data.set("name", (data.get("name") ?? nameValue).trim());
    data.set("email", (data.get("email") ?? emailValue).trim());

    if (googleUser) {
      data.set("googleUid", googleUser.uid);
      data.set("photoURL", googleUser.photoURL || "");
    }

    try {
      const res = await fetch("/api/auth/signup-doctor", {
        method: "POST",
        body: data,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.code === "VALIDATION_ERROR" && json.errors) {
          setFieldErrors((p) => ({ ...p, ...json.errors }));
        } else if (json.code === "EMAIL_EXISTS") {
          setFieldErrors((p) => ({ ...p, email: "This email is already registered." }));
          setStep(1);
        } else if (json.code === "WEAK_PASSWORD") {
          setFieldErrors((p) => ({ ...p, password: "Password is too weak. Try a stronger one." }));
          setStep(1);
        } else if (json.code === "TOO_MANY_REQUESTS") {
          setServerError("Too many attempts. Please wait a moment and try again.");
        } else {
          setServerError(json.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      if (json.data?.idToken && typeof window !== "undefined") {
        localStorage.setItem("vitality_token", json.data.idToken);
        localStorage.setItem("vitality_user", JSON.stringify(json.data));
        document.cookie = `vitality_token=${json.data.idToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      router.push("/signup/doctor/pending");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Step Progress Indicator ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
          <span className={`transition-colors ${step === 1 ? "text-primary" : "text-muted"}`}>
            1. Personal Info
          </span>
          <span className={`transition-colors ${step === 2 ? "text-primary" : "text-muted"}`}>
            2. Professional Verification
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {/* ── Google Connected Badge (Shown if user connected Google) ────────── */}
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
                {googleUser.name?.[0] || "D"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{googleUser.name}</p>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs text-muted">{googleUser.email} • Connected with Google</p>
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

      {/* ── Main Form with Dynamic-Height Sliding Container ────────────────── */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {serverError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {serverError}
          </p>
        )}

        {/* Dynamic height container: transitions height smoothly, eliminates empty space */}
        <div
          className="relative overflow-hidden transition-[height] duration-500 ease-in-out"
          style={{ height: sliderHeight ? `${sliderHeight}px` : "auto" }}
        >
          <div
            className={`flex w-[200%] items-start transition-transform duration-500 ease-in-out ${
              step === 2 ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* ── SLIDE 1: Personal & Account Info ─────────────────────────── */}
            <div ref={slide1Ref} className="w-1/2 shrink-0 pe-2 ps-0.5">
              <div className="flex flex-col gap-4">
                <InputField
                  label="Username"
                  name="username"
                  icon={<AtSign className="h-5 w-5" />}
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                  error={fieldErrors.username}
                />

                <InputField
                  label="Full name"
                  name="name"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  icon={<User className="h-5 w-5" />}
                  placeholder="Dr. Ahmed Ali"
                  autoComplete="name"
                  required
                  error={fieldErrors.name}
                />

                <InputField
                  label="Email address"
                  name="email"
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  readOnly={Boolean(googleUser)}
                  icon={<Mail className="h-5 w-5" />}
                  placeholder="doctor@example.com"
                  autoComplete="email"
                  required
                  error={fieldErrors.email}
                />

                <InputField
                  label="Country"
                  name="country"
                  icon={<MapPinHouse className="h-5 w-5" />}
                  placeholder="Enter your country"
                  autoComplete="country"
                />

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
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-surface-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>

                {/* Passwords (shown only if not using Google) */}
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

                {/* Continue button for Slide 1 */}
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary font-button text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                >
                  <span>Continue to Verification</span>
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Google option BELOW normal signup in Slide 1 */}
                {!googleUser && (
                  <div className="flex flex-col gap-4 pt-1">
                    <OrDivider />
                    <GoogleButton loading={googleLoading} onClick={handleGoogle} />
                  </div>
                )}
              </div>
            </div>

            {/* ── SLIDE 2: Professional Verification ──────────────────────── */}
            <div ref={slide2Ref} className="w-1/2 shrink-0 pe-0.5 ps-2">
              <div className="flex flex-col gap-4">
                <InputField
                  label="Medical specialty"
                  name="specialty"
                  icon={<Stethoscope className="h-5 w-5" />}
                  placeholder="e.g. Cardiology, Pediatrics"
                  required
                  error={fieldErrors.specialty}
                />

                <InputField
                  label="License number"
                  name="licenseNumber"
                  icon={<FileText className="h-5 w-5" />}
                  placeholder="Your professional license number"
                  required
                  error={fieldErrors.licenseNumber}
                />

                {/* Medical License Section */}
                <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-surface-foreground">
                    Medical License (Required)
                  </p>

                  <InputField
                    label="Issuing Institution"
                    name="licenseIssuer"
                    icon={<Building2 className="h-5 w-5" />}
                    placeholder="e.g. Ministry of Health, Medical Syndicate"
                    required
                    error={fieldErrors.licenseIssuer}
                  />

                  <InputField
                    label="Issue Year"
                    name="licenseYear"
                    type="number"
                    min="1950"
                    max={maxYear}
                    icon={<Calendar className="h-5 w-5" />}
                    placeholder="e.g. 2021"
                    required
                    error={fieldErrors.licenseYear}
                  />

                  <FileDropZone
                    label="License Document"
                    name="licenseDoc"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    hint="PDF, JPG, or PNG — max 10 MB"
                    error={fieldErrors.licenseDoc}
                  />
                </div>

                {/* Medical Degree Section */}
                <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-surface-foreground">
                    Medical Degree / Diploma (Optional)
                  </p>

                  <InputField
                    label="Degree Title"
                    name="degreeTitle"
                    icon={<GraduationCap className="h-5 w-5" />}
                    placeholder="e.g. Bachelor of Medicine & Surgery (MBBCh)"
                  />

                  <InputField
                    label="University / Institution"
                    name="degreeIssuer"
                    icon={<Building2 className="h-5 w-5" />}
                    placeholder="e.g. Cairo University"
                  />

                  <InputField
                    label="Graduation Year"
                    name="degreeYear"
                    type="number"
                    min="1950"
                    max={maxYear}
                    icon={<Calendar className="h-5 w-5" />}
                    placeholder="e.g. 2018"
                  />

                  <FileDropZone
                    label="Degree Document"
                    name="degreeDoc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hint="PDF, JPG, or PNG — max 10 MB"
                  />
                </div>

                {/* Terms & Conditions */}
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
                      <a href="/terms" className="font-semibold text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="font-semibold text-primary hover:underline">
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

                {/* Slide 2 Action Buttons: Back + Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface font-button text-base font-semibold text-surface-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-14 flex-[2] items-center justify-center rounded-full bg-primary font-button text-lg font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit for review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
