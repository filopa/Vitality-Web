import { getMissingFields, normalizeProfile, toPublicProfile, validateProfile } from "@/lib/profile";
import { authenticate, fail, ok } from "@/lib/server/api";
import { getUser, isUsernameTaken, saveProfile } from "@/lib/server/users";

function describe(user) {
  const missing = getMissingFields(user);
  return { profile: user ? toPublicProfile(user) : null, missing, profileComplete: missing.length === 0 };
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

  const profile = normalizeProfile(body);
  const errors = validateProfile(profile);
  if (body.terms !== true) errors.terms = "You must accept the terms and conditions.";
  if (Object.keys(errors).length > 0) {
    return fail(400, "VALIDATION_ERROR", "Please fix the highlighted fields.", { errors });
  }

  if (await isUsernameTaken(profile.username, decoded.uid)) {
    return fail(409, "USERNAME_TAKEN", "This username is already taken.", {
      errors: { username: "This username is already taken." },
    });
  }

  return ok(describe(await saveProfile(decoded, profile)));
}
