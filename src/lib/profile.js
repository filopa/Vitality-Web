import { isValidName, isValidUsername } from "./validations";

const PROFILE_FIELDS = [
  "username",
  "name",
  "phone",
  "country",
  "gender",
  "birthday",
];

export function toFormValues(profile = {}) {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, String(profile?.[field] ?? "")]),
  );
}

export function normalizeProfile(body = {}) {
  const values = toFormValues(body);
  return {
    ...values,
    username: values.username.toLowerCase(),
    name: values.name.trim(),
    phone: values.phone.trim(),
    country: values.country.trim(),
    gender: values.gender.trim().toLowerCase(),
    birthday: values.birthday.trim(),
  };
}

export function validateProfile(profile) {
  const errors = {};

  if (!isValidUsername(profile.username)) {
    errors.username =
      "Username must be 3–30 characters, lowercase, and contain only letters, numbers, or underscores.";
  }
  if (!isValidName(profile.name)) {
    errors.name = "Name must be between 2 and 50 characters.";
  }
  if (!profile.phone) {
    errors.phone = "Phone number is required.";
  }
  if (!profile.country) {
    errors.country = "Country is required.";
  }
  if (!["male", "female"].includes(profile.gender)) {
    errors.gender = "Please select your gender.";
  }

  return errors;
}

export function getMissingFields(profile) {
  if (!profile) return [...PROFILE_FIELDS];
  return PROFILE_FIELDS.filter((field) => !String(profile[field] ?? "").trim());
}

export function toPublicProfile(profile) {
  if (!profile) return null;

  return {
    uid: profile.uid ?? "",
    name: profile.name ?? "",
    email: profile.email ?? "",
    username: profile.username ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    gender: profile.gender ?? "",
    birthday: profile.birthday ?? "",
    bio: profile.bio ?? "",
    photoURL: profile.photoURL ?? profile.avatarURL ?? "",
    avatarURL: profile.avatarURL ??profile.photoURL ?? "",
    type: profile.type ?? "user",
  };
}
