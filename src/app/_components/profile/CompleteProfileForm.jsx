"use client";

import { AtSign, MapPinHouse, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/client/api";
import { mergeStoredUser } from "@/lib/client/session";
import { toFormValues, validateProfile } from "@/lib/profile";
import { InputField } from "../Inputfield";
import { BirthdayField, GenderField } from "./ProfileFields";

export function CompleteProfileForm() {
  const router = useRouter();
  const [values, setValues] = useState(toFormValues());
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));
  const onChange = (name) => (e) => setValue(name, e.target.value);

  // Prefill with whatever we already know (e.g. name from Google)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await authedFetch("/api/auth/user/profile");
        const json = await res.json();
        if (cancelled) return;

        if (json.data?.profileComplete) return router.replace("/home");
        setValues(toFormValues(json.data?.profile));
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

    const found = validateProfile(values);
    if (!terms) found.terms = "You must accept the terms and conditions.";
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ ...values, terms }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        else setServerError(json.message ?? "Something went wrong. Please try again.");
        return;
      }

      mergeStoredUser(json.data.profile);
      // Full navigation so the rest of the app reloads with the completed profile.
      window.location.assign("/home");
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {serverError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <InputField
          label="Username"
          name="username"
          value={values.username}
          onChange={onChange("username")}
          icon={<AtSign className="h-5 w-5" />}
          placeholder="Choose a username"
          autoComplete="username"
          error={errors.username}
        />
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
        <InputField
          label="Phone number"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={onChange("phone")}
          icon={<Phone className="h-5 w-5" />}
          placeholder="Enter your phone number"
          autoComplete="tel"
          error={errors.phone}
        />
        <InputField
          label="Country"
          name="country"
          value={values.country}
          onChange={onChange("country")}
          icon={<MapPinHouse className="h-5 w-5" />}
          placeholder="Enter your country"
          autoComplete="country-name"
          error={errors.country}
        />
        <GenderField value={values.gender} onChange={(v) => setValue("gender", v)} error={errors.gender} />
        <BirthdayField value={values.birthday} onChange={onChange("birthday")} error={errors.birthday} />

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
              <a href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
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
