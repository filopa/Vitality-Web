import { adminRTDB } from "@/lib/firebase-admin";
import { toPublicUser } from "./public-user";

export const MAX_BATCH = 50;

// Firebase uids are alphanumeric; this also keeps anything that isn't a safe Realtime Database key out of the path.
const UID = /^[A-Za-z0-9_-]{1,128}$/;

/** Validates the request's uid list. Returns { uids } (deduplicated, original order) or { error, status }. */
export function parseUidList(input) {
  if (!Array.isArray(input)) return { status: 400, error: "uids must be an array." };

  const uids = [...new Set(input)];
  if (uids.length === 0) return { status: 400, error: "Send at least one uid." };
  if (uids.length > MAX_BATCH) {
    return { status: 413, error: `You can request at most ${MAX_BATCH} users at once.` };
  }
  if (!uids.every((uid) => typeof uid === "string" && UID.test(uid))) {
    return { status: 400, error: "One or more uids are invalid." };
  }
  return { uids };
}

/**
 * Looks the users up in parallel.
 *   users:   public profiles, in the order the uids were sent
 *   missing: uids that don't exist or have no finished profile (no username)
 */
export async function getPublicUsers(uids) {
  const snaps = await Promise.all(uids.map((uid) => adminRTDB.ref(`users/${uid}`).get()));

  const users = [];
  const missing = [];
  uids.forEach((uid, i) => {
    const user = snaps[i].exists() ? snaps[i].val() : null;
    if (user?.username) users.push(toPublicUser(uid, user));
    else missing.push(uid);
  });

  return { users, missing };
}
