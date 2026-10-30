import { adminRTDB } from "@/lib/firebase-admin";

const userRef = (uid) => adminRTDB.ref(`users/${uid}`);

export async function getUser(uid) {
  const snap = await userRef(uid).get();
  return snap.exists() ? snap.val() : null;
}

// Add ".indexOn": ["username"] under "users" in your database rules for fast queries.
export async function isUsernameTaken(username, uid) {
  const snap = await adminRTDB
    .ref("users")
    .orderByChild("username")
    .equalTo(username)
    .limitToFirst(2)
    .get();

  if (!snap.exists()) return false;
  return Object.keys(snap.val()).some((key) => key !== uid);
}

/** Creates the profile if it doesn't exist yet (e.g. Google sign-in that never finished signup). */
export async function saveProfile(decoded, profile) {
  const userReference = userRef(decoded.uid);
  const existingSnap = await userReference.get();
  const existing = existingSnap.exists() ? existingSnap.val() : null;
  const now = new Date().toISOString();

await userReference.update({
    ...profile,
    email: existing?.email ?? decoded.email ?? "",
    photoURL: existing?.photoURL ?? decoded.picture ?? "",
    avatarURL: existing?.photoURL ?? decoded.picture ?? "",
    termsAcceptedAt: now,
    updatedAt: now,
    ...(existing ? {} : { createdAt: now }),
  });

  const updatedSnap = await userReference.get();
  return updatedSnap.val();
}

export async function deleteUserData(uid) {
  await userRef(uid).remove();
  // TODO: also delete this user's related data (posts, comments, messages, uploaded files).
}
