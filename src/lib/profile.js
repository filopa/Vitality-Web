import {
  getPhoneE164,
  PHONE_VALIDATION_ERROR,
  resolveCountryCode,
} from "./phone";
import {
  isValidName,
  isValidUsername,
  USERNAME_ERROR_MESSAGE,
} from "./validations";

const PROFILE_FIELDS = [
  "username",
  "name",
  "phone",
  "requestedType",
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
    requestedType: values.requestedType.trim(),
    country: resolveCountryCode(values.country) || values.country.trim(),
    gender: values.gender.trim().toLowerCase(),
    birthday: values.birthday.trim(),
  };
}

export function validateProfile(profile) {
  const errors = {};

  if (!isValidUsername(profile.username.trim().toLowerCase())) {
    errors.username = USERNAME_ERROR_MESSAGE;
  }
  if (!isValidName(profile.name)) {
    errors.name = "Name must be between 2 and 50 characters.";
  }
  if (!profile.phone) {
    errors.phone = "Phone number is required.";
  } else if (!getPhoneE164(profile.phone, profile.country)) {
    errors.phone = PHONE_VALIDATION_ERROR;
  }
  if (!profile.requestedType) {
    errors.requestedType = "Requested type is required.";
  }
  if (!resolveCountryCode(profile.country)) {
    errors.country = "Select a valid country.";
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

  const photo =
    profile.urlProfile ||
    profile.photoURL ||
    profile.avatarURL ||
    profile.urlAvatar ||
    "";
  const avatar =
    profile.urlAvatar ||
    profile.avatarURL ||
    profile.photoURL ||
    profile.urlProfile ||
    "";

  return {
    uid: profile.uid ?? "",
    name: profile.name ?? "",
    email: profile.email ?? "",
    username: profile.username ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    gender: profile.gender ?? "",
    birthday: profile.birthday ?? "",
    requestedType: profile.requestedType ?? "",
    bio: profile.bio ?? "",
    photoURL: photo,
    avatarURL: avatar,
    urlProfile: profile.urlProfile ?? photo,
    urlAvatar: profile.urlAvatar ?? avatar,
    vitals: profile.vitals ?? null,
    emergencyContact: profile.emergencyContact ?? profile.emergency ?? null,
    family: profile.family ?? {},
    active: profile.active ?? true,
    lastSeen: profile.lastSeen ?? null,
    type: profile.type ?? "user",
    createdAt: profile.createdAt ?? null,
  };
}
