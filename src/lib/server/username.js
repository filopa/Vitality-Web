import "server-only";
import { adminRTDB } from "@/lib/firebase-admin";
import { isValidUsername, USERNAME_ERROR_MESSAGE } from "@/lib/validations";

const normalizeUsername = (value = "") => String(value).trim().toLowerCase();

async function isUsernameTaken(username, currentUid = null) {
  const snapshot = await adminRTDB
    .ref("users")
    .orderByChild("username")
    .equalTo(username)
    .limitToFirst(2)
    .get();

  if (!snapshot.exists()) return false;

  if (currentUid) {
    const users = snapshot.val();

    return Object.entries(users).some(([uid]) => uid !== currentUid);
  }

  return true;
}

function generateSuggestions(name, birthDate, requestedUsername) {
  const cleanName = normalizeUsername(name);
  const requested = normalizeUsername(requestedUsername);

  const parts = cleanName.split("_").filter(Boolean);
  const firstName = parts[0] || requested;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  const year = /^\d{4}-\d{2}-\d{2}$/.test(birthDate || "")
    ? birthDate.slice(0, 4)
    : "";

  const initials = parts.map((part) => part[0]).join("");

  const candidates = [
    cleanName,
    `${firstName}${lastName}`,
    `${firstName}_${lastName}`,
    `${initials}${firstName}`,
    year ? `${firstName}${year}` : "",
    year ? `${firstName}_${year}` : "",
    year ? `${firstName}${lastName}${year}` : "",
    `${requested}01`,
    `${requested}02`,
    `${requested}03`,
  ];

  return [...new Set(candidates)]
    .map(normalizeUsername)
    .filter(isValidUsername);
}

export async function checkUsername({
  username,
  name,
  birthDate,
  currentUid = null,
  suggestionsLimit = 5,
}) {
  if (
    typeof username !== "string" ||
    !isValidUsername(normalizeUsername(username))
  ) {
    return {
      success: false,
      available: false,
      code: "INVALID_USERNAME",
      message: USERNAME_ERROR_MESSAGE,
      suggestions: [],
    };
  }

  const normalized = normalizeUsername(username);

  const taken = await isUsernameTaken(normalized, currentUid);

  if (!taken) {
    return {
      success: true,
      available: true,
      username: normalized,
      suggestions: [],
    };
  }

  const candidates = generateSuggestions(name, birthDate, normalized).filter(
    (candidate) => candidate !== normalized,
  );

  const suggestions = [];

  for (const candidate of candidates) {
    if (suggestions.length >= suggestionsLimit) break;

    const exists = await isUsernameTaken(candidate, currentUid);

    if (!exists) {
      suggestions.push(candidate);
    }
  }

  return {
    success: true,
    available: false,
    username: normalized,
    suggestions,
    message: "Username is already taken.",
  };
}
