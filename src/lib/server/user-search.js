import { parsePhoneNumberFromString } from "libphonenumber-js";
import { adminRTDB } from "@/lib/firebase-admin";

/*
 How it works
 ─ Realtime Database can't do "contains" searches, so every user gets small lowercase search fields
   (buildSearchFields) and we run indexed PREFIX / EXACT queries on them.
 ─ name and username: prefix search ("ahm" finds "Ahmed").
 ─ email and phone: EXACT match only, on purpose. If prefixes were allowed, anyone could type "a", "b", "c"...
   and harvest every member's email or phone number.
 ─ Needs ".indexOn" for the 5 fields below under "users" in your database rules.
*/

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[\d\s().-]+$/;
const USERNAME = /^[a-z0-9_]{2,30}$/;

/** Lowercase, no accents/diacritics, Arabic letter variants unified (أ إ آ → ا, ى → ي, ة → ه). */
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Spread the result into every write to users/{uid} (signup, google-signin, profile update). */
export function buildSearchFields({ name, username, email, phone } = {}) {


  return {
    name: normalizeText(name),
    username: String(username ?? "").trim().toLowerCase(),
    email: String(email ?? "").trim().toLowerCase(),
 };
}

/** Turns what the person typed into the queries we will run. */
function planQuery(raw) {
  const q = raw.trim();
  const lookups = [];

  if (EMAIL.test(q)) {
    lookups.push({ field: "email", equal: q.toLowerCase(), by: "email" });
  }

  if (PHONE_CHARS.test(q)) {
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 7) {
   }
  }

  const handle = q.replace(/^@/, "").toLowerCase();
  if (USERNAME.test(handle)) {
    lookups.push({ field: "username", prefix: handle, by: "username" });
  }

  const name = normalizeText(q.replace(/^@/, ""));
  if (name.length >= 2 && !/\d/.test(name)) {
    lookups.push({ field: "name", prefix: name, by: "name" });
  }

  return lookups;
}

async function runLookup({ field, equal, prefix }, limit) {
  let query = adminRTDB.ref("users").orderByChild(field);
  query = equal !== undefined ? query.equalTo(equal) : query.startAt(prefix).endAt(`${prefix}\uf8ff`);

  const snap = await query.limitToFirst(limit).get();
  const rows = [];
  snap.forEach((child) => {
    rows.push([child.key, child.val()]);
  });
  return rows;
}

function rankOf(lookup, user) {
  if (lookup.by === "username") return user.username === lookup.prefix ? 0 : 1;
  if (lookup.by === "name") return 2;
  return 0; // exact email / phone match
}

/** Only what the UI needs. Email and phone are never returned. */
function toPublicUser(uid, user, matchedBy) {
  return {
    uid,
    name: user.name ?? "",
    username: user.username ?? "",
    photoURL: user.photoURL || "",
    type: user.type ?? null,
    verified: Boolean(user.verified),
    matchedBy,
  };
}

export async function searchUsers(rawQuery, { limit = DEFAULT_LIMIT, excludeUid } = {}) {
  const max = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const lookups = planQuery(String(rawQuery ?? ""));
  if (lookups.length === 0) return [];

  // +1 so removing the caller from the results still leaves `max` rows
  const batches = await Promise.all(lookups.map((lookup) => runLookup(lookup, max + 1)));

  const best = new Map(); // uid → best match
  lookups.forEach((lookup, i) => {
    for (const [uid, user] of batches[i]) {
      if (uid === excludeUid) continue;
      const rank = rankOf(lookup, user);
      const previous = best.get(uid);
      if (!previous || rank < previous.rank) best.set(uid, { uid, user, by: lookup.by, rank });
    }
  });

  return [...best.values()]
    .sort((a, b) => a.rank - b.rank || String(a.user.name ?? "").localeCompare(String(b.user.name ?? "")))
    .slice(0, max)
    .map(({ uid, user, by }) => toPublicUser(uid, user, by));
}
