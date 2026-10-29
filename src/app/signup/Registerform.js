"use client";

import { AtSign, Lock, Mail, MapPinHouse, Phone, User,Mars, Venus  } from "lucide-react";
import { useState } from "react";
import { InputField } from "../Componnet/Inputfield";

export function RegisterForm() {
  const [confirmError, setConfirmError] = useState();
  const [submitting, setSubmitting] = useState(false);
  const [gender, setGender] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    if (data.get("password") !== data.get("confirmPassword")) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setConfirmError(undefined);
    setSubmitting(true);

    try {
      // TODO: call your register API / server action with:
      // { username, email, password }
      console.log(Object.fromEntries(data));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <InputField
          label="Username"
          name="username"
          icon={<AtSign className="h-5 w-5" />}
          placeholder="Choose a username"
          autoComplete="username"
          required
        />
        <InputField
          label="Name"
          name="name"
          icon={<User className="h-5 w-5" />}
          placeholder="Enter your name"
          autoComplete="name"
          required
        />
        <InputField
          label="Email address"
          name="email"
          type="email"
          icon={<Mail className="h-5 w-5" />}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
        
        <InputField
          label="Country"
          name="country"
          icon={<MapPinHouse className="h-5 w-5" />}
          placeholder="Enter your country"
          autoComplete="country"
          required
        />
        <InputField
          label="Phone number"
          name="phone"
          icon={<Phone className="h-5 w-5" />}
          placeholder="Enter your phone number"
          autoComplete="tel"
          required
        />
        <div className="flex flex-col gap-2">
 <label
    htmlFor="birthday"
    className="text-sm font-medium text-[#0b2a4a]"
  >
    Gender
  </label>
       
  <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setGender("male")}
        className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
          gender === "male"
            ? "border-[#0b9ab8] bg-[#0b9ab8]/10 text-[#0b9ab8]"
            : "border-slate-200 text-slate-500 hover:border-[#0b9ab8]"
        }`}
      >
        <Mars className="h-5 w-5" />
        <span>Male</span>
      </button>

      <button
        type="button"
        onClick={() => setGender("female")}
        className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
          gender === "female"
            ? "border-[#0b9ab8] bg-[#0b9ab8]/10 text-[#0b9ab8]"
            : "border-slate-200 text-slate-500 hover:border-[#0b9ab8]"
        }`}
      >
        <Venus className="h-5 w-5" />
        <span>Female</span>
      </button>

      <input type="hidden" name="gender" value={gender} />
    </div> </div>
<div className="flex flex-col gap-2">
  <label
    htmlFor="birthday"
    className="text-sm font-medium text-foreground"
  >
    Birthday
  </label>

  <input
    type="date"
    id="birthday"
    name="birthday"
    className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-surface-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
  />
</div>
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
        />
        <InputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          revealable
          icon={<Lock className="h-5 w-5" />}
          placeholder="Create a strong password"
          autoComplete="new-password"
          error={confirmError}
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="h-14 w-full rounded-full bg-primary font-button text-xl font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
