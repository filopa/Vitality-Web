import { getPhoneE164 } from "@/lib/phone";
import {
  getMissingFields,
  normalizeProfile,
  toPublicProfile,
  validateProfile,
} from "@/lib/profile";
import { authenticate, fail, ok } from "@/lib/server/api";
import { getUser, isUsernameTaken, saveProfile } from "@/lib/server/users";

function describe(user) {
  const missing = getMissingFields(user);
  return {
    profile: user ? toPublicProfile(user) : null,
    missing,
    profileComplete: missing.length === 0,
  };
}

export async function GET(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  return ok(describe(await getUser(decoded.uid)));
}

export async function PATCH(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid request body.");
  }

  const existingUser = await getUser(decoded.uid);
  const storedUsername = String(existingUser?.username ?? "").trim();
  const profile = normalizeProfile({
    ...existingUser,
    ...body,
    username: storedUsername || body.username,
    requestedType: body.requestedType ?? existingUser?.requestedType ?? "",
  });
  const phoneE164 = getPhoneE164(profile.phone, profile.country);
  if (phoneE164) profile.phone = phoneE164;
  if (storedUsername) profile.username = storedUsername;
  const errors = validateProfile(profile);
  if (storedUsername) delete errors.username;
  if (body.terms !== true)
    errors.terms = "You must accept the terms and conditions.";
  if (Object.keys(errors).length > 0) {
    return fail(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", {
      errors,
    });
  }
  if (!["user", "doctor"].includes(profile.requestedType)) {
    return fail(400, "INVALID_REQUESTED_TYPE", "Invalid account type.");
  }
  if (
    !storedUsername &&
    (await isUsernameTaken(profile.username, decoded.uid))
  ) {
    return fail(409, "USERNAME_TAKEN", "This username is already taken.", {
      errors: { username: "This username is already taken." },
    });
  }

  return ok(describe(await saveProfile(decoded, profile)));
}
