"use client";

import { AtSign, Stethoscope, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authedFetch } from "@/lib/client/api";
import {
  formatLocalPhone,
  getInitialPhoneValues,
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
} from "@/lib/phone";
import { toFormValues, validateProfile } from "@/lib/profile";
import { isValidUsername, USERNAME_ERROR_MESSAGE } from "@/lib/validations";
import { InputField } from "../Inputfield";
import { CountryPhoneField } from "./CountryPhoneField";
import { BirthdayField, GenderField } from "./ProfileFields";

export function CompleteProfileForm() {
  const router = useRouter();
  const [values, setValues] = useState(toFormValues());
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savedUsername, setSavedUsername] = useState("");

  const usernameRequestRef = useRef(0);
  const setValue = (name, value) =>
    setValues((prev) => ({ ...prev, [name]: value }));
  const onCountryChange = (country) => {
    const phone = formatLocalPhone(values.phone, country);
    setValues((prev) => ({ ...prev, country, phone }));
    setErrors((prev) => ({
      ...prev,
      country: undefined,
      phone:
        phone && !getPhoneE164(phone, country)
          ? PHONE_VALIDATION_ERROR
          : undefined,
    }));
  };
  const onPhoneChange = (phone) => {
    setValue("phone", phone);
    if (errors.phone && getPhoneE164(phone, values.country)) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const onChange = (name) => (e) => {
    setValue(name, e.target.value);

    if (name === "username") {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
  };

  // Automatically check username availability with debounce.
  useEffect(() => {
    const username = (values.username || "").trim().toLowerCase();

    if (savedUsername) {
      usernameRequestRef.current++;
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      setCheckingUsername(false);
      setErrors((prev) => ({ ...prev, username: undefined }));
      return;
    }

    if (!username) {
      usernameRequestRef.current++;
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      setCheckingUsername(false);
      return;
    }

    if (!isValidUsername(username)) {
      usernameRequestRef.current++;
      setUsernameStatus(null);
      setUsernameSuggestions([]);
      setCheckingUsername(false);
      setErrors((prev) => ({ ...prev, username: USERNAME_ERROR_MESSAGE }));
      return;
    }

    setErrors((prev) => ({ ...prev, username: undefined }));
    setUsernameStatus(null);
    setUsernameSuggestions([]);
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
            username,
            name: values.name || "",
            birthDate: values.birthday || "",
          }),
        });

        const result = await response.json();

        if (requestId !== usernameRequestRef.current) return;

        if (!response.ok) {
          throw new Error(result.error || "Unable to check username");
        }

        setUsernameStatus(result.available);
        setUsernameSuggestions(result.suggestions || []);
      } catch (error) {
        if (requestId !== usernameRequestRef.current) return;

        console.error("Username check failed:", error);
        setUsernameStatus("error");
      } finally {
        if (requestId === usernameRequestRef.current) {
          setCheckingUsername(false);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [values.username, values.name, values.birthday, savedUsername]);

  // Prefill with whatever we already know (e.g. name from Google)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authedFetch("/api/auth/user/profile");
        const json = await res.json();
        if (cancelled) return;

        if (json.data?.profileComplete) return router.replace("/home");
        const profile = json.data?.profile;
        setSavedUsername(String(profile?.username ?? "").trim());
        const profileValues = toFormValues(profile);
        setValues({
          ...profileValues,
          ...getInitialPhoneValues(profileValues.country, profileValues.phone),
        });
      } catch (err) {
        if (cancelled) return;
        if (err.message === "NOT_SIGNED_IN") return router.replace("/login");
        setServerError("Couldn't load your profile. Please refresh the page.");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();

    const phoneE164 = getPhoneE164(values.phone, values.country);
    const submittedValues = {
      ...values,
      phone: phoneE164 || values.phone,
    };
    const found = validateProfile(submittedValues);

    if (savedUsername) {
      delete found.username;
    } else {
      if (!isValidUsername(values.username.trim().toLowerCase())) {
        found.username = USERNAME_ERROR_MESSAGE;
      } else if (usernameStatus !== true || checkingUsername) {
        found.username = checkingUsername
          ? "Please wait while we check your username."
          : usernameStatus === false
            ? "This username is already taken."
            : usernameStatus === "error"
              ? "Unable to verify username. Please try again."
              : "Please enter a valid and available username.";
      }
    }

    if (!terms) {
      found.terms = "You must accept the terms and conditions.";
    }

    setErrors(found);
    setServerError("");

    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ ...submittedValues, terms }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        else
          setServerError(
            json.message ?? "Something went wrong. Please try again.",
          );
        return;
      }

      window.location.assign("/home");
    } catch {
      setServerError(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading…</p>;
  }

  return (
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
              onClick={() => setValue("requestedType", "user")}
              aria-pressed={values.requestedType === "user"}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                values.requestedType === "user"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:border-primary"
              }`}
            >
              <UserRound className="h-5 w-5" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("requestedType", "doctor")}
              aria-pressed={values.requestedType === "doctor"}
              className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
                values.requestedType === "doctor"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:border-primary"
              }`}
            >
              <Stethoscope className="h-5 w-5" />
              <span>Doctor</span>
            </button>
          </div>

          <input
            type="hidden"
            name="type"
            value={values.requestedType}
            onChange={onChange("requestedType")}
            error={errors.requestedType}
          />
        </div>
        <div>
          <InputField
            label="Username"
            name="username"
            value={values.username}
            onChange={onChange("username")}
            readOnly={Boolean(savedUsername)}
            icon={<AtSign className="h-5 w-5" />}
            placeholder="Choose a username"
            autoComplete="username"
            error={errors.username}
          />

          {!savedUsername && (
            <div className="mt-2 text-sm" aria-live="polite">
              {checkingUsername && (
                <p className="text-muted">Checking username availability...</p>
              )}

              {!checkingUsername && usernameStatus === true && (
                <p className="text-green-600">✓ Username is available</p>
              )}

              {!checkingUsername && usernameStatus === false && (
                <div className="text-red-500">
                  <p>✕ Username is already taken.</p>

                  {usernameSuggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {usernameSuggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setValue("username", item)}
                          className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition hover:bg-surface"
                        >
                          @{item}
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
          )}
        </div>

        <InputField
          label="Name"
          name="name"
          value={values.name}
          onChange={onChange("name")}
          icon={<User className="h-5 w-5" />}
          placeholder="Enter your name"
          autoComplete="name"
          error={errors.name}
        />

        <CountryPhoneField
          country={values.country}
          phone={values.phone}
          onCountryChange={onCountryChange}
          onPhoneChange={onPhoneChange}
          countryError={errors.country}
          phoneError={errors.phone}
        />

        <GenderField
          value={values.gender}
          onChange={(v) => setValue("gender", v)}
          error={errors.gender}
        />

        <BirthdayField
          value={values.birthday}
          onChange={onChange("birthday")}
          error={errors.birthday}
        />

        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <span className="text-sm leading-5 text-muted">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                className="font-semibold text-primary hover:underline"
                rel="noopener"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                className="font-semibold text-primary hover:underline"
                rel="noopener"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {errors.terms && (
            <p role="alert" className="text-sm text-red-500">
              {errors.terms}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="h-14 w-full rounded-full bg-primary font-button text-xl font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
