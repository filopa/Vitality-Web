"use client";

import { AtSign, Mail, Trash2, User, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/client/api";
import {
  formatLocalPhone,
  getInitialPhoneValues,
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
} from "@/lib/phone";
import { toFormValues, validateProfile } from "@/lib/profile";
import { InputField } from "../Inputfield";
import { AvatarUploader } from "./AvatarUploader";
import { CountryPhoneField } from "./CountryPhoneField";
import { BirthdayField, GenderField } from "./ProfileFields";
import { useApp } from "@/lib/AppProvider";

const toEditFormValues = (profile) => ({
  ...toFormValues(profile),
  bio: String(profile?.bio ?? ""),
  showFollowers: profile?.showFollowers === true,
});

const withLocalPhone = (values) => ({
  ...values,
  ...getInitialPhoneValues(values.country, values.phone),
});

export function EditProfileForm({  setIsEditProfileOpen }) {
  const { loading, userData, refreshUserData } = useApp();
  const [values, setValues] = useState(toEditFormValues(userData));
  const [initial, setInitial] = useState(null); // last saved values, used to detect changes
  const [account, setAccount] = useState({ email: "", username: "", photoURL: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isDirty = initial && Object.keys(values).some((key) => values[key] !== initial[key]);

  const setValue = (name, value) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [name]: value }));
  };
  const onChange = (name) => (e) => setValue(name, e.target.value);

  const onCountryChange = (country) => {
    const phone = formatLocalPhone(values.phone, country);
    setSaved(false);
    setValues((prev) => ({ ...prev, country, phone }));
    setErrors((prev) => ({
      ...prev,
      country: undefined,
      phone: phone && !getPhoneE164(phone, country) ? PHONE_VALIDATION_ERROR : undefined,
    }));
  };

  const onPhoneChange = (phone) => {
    setValue("phone", phone);
    if (errors.phone && getPhoneE164(phone, values.country)) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Load the current profile
  useEffect(() => {
    if (!loading && userData) {
      const profileValues = withLocalPhone(toEditFormValues(userData));
      setValues(profileValues);
      setInitial(profileValues);
      setAccount({
        email: userData.email || "",
        username: userData.username || "",
        photoURL:
          userData.urlProfile ||
          userData.photoURL ||
          userData.avatarURL ||
          userData.urlAvatar ||
          "",
      });

    }
  }, [loading, userData]);

  async function handleSubmit(e) {
    e.preventDefault();

    const phoneE164 = getPhoneE164(values.phone, values.country);
    const submittedValues = { ...values, phone: phoneE164 || values.phone };

    const found = validateProfile(submittedValues);
    delete found.username; // username is locked after signup

    setErrors(found);
    setServerError("");
    setSaved(false);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(submittedValues),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        setServerError(json.message ?? "Something went wrong. Please try again.");
        return;
      }

      const latest = json.data?.profile
        ? withLocalPhone(toEditFormValues(json.data.profile))
        : values;
      setValues(latest);
      setInitial(latest);
      setSaved(true);
      await refreshUserData();
      setIsEditProfileOpen(false)
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }


  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <AvatarUploader
        name={values.name}
        photoURL={account.photoURL}
        onChange={(photoURL) => setAccount((prev) => ({ ...prev, photoURL }))}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {serverError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </p>
        )}
        {saved && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            Profile updated.
          </p>
        )}

        <div className="flex flex-col gap-4">
          <InputField
            label="Email address"
            name="email"
            type="email"
            value={account.email}
            readOnly
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />
          <InputField
            label="Username"
            name="username"
            value={account.username}
            readOnly
            icon={<AtSign className="h-5 w-5" />}
            autoComplete="username"
          />
          <p className="-mt-2 text-xs text-muted">Your email and username can&apos;t be changed.</p>

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
          
          {console.log(values)}
          <GenderField value={values.gender} onChange={(v) => setValue("gender", v)} error={errors.gender} />

          <BirthdayField value={values.birthday} onChange={onChange("birthday")} error={errors.birthday} />
        </div>

        {/* Bio (string up to 150 chars per schema) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="profile-bio"
              className="text-xs font-semibold text-muted uppercase"
            >
              Bio
            </label>
            <span className="text-[11px] text-muted">{values.bio.length}/150</span>
          </div>
          <textarea
            id="profile-bio"
            maxLength={150}
            rows={2}
            value={values.bio}
            onChange={onChange("bio")}
            placeholder="Short health summary or personal note…"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary resize-none"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-4 text-sm">
          <input
            type="checkbox"
            checked={values.showFollowers}
            onChange={(event) => setValue("showFollowers", event.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <span>
            <span className="block font-semibold text-foreground">
              Show my followers publicly
            </span>
            <span className="mt-1 block text-xs text-muted">
              Only follower names and public profile photos are shown. Health and account details stay private.
            </span>
          </span>
        </label>

 
        <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(false)}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isDirty || submitting}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>

      </form>
    </div>
  );
}
