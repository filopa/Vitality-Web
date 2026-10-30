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
    requestedType:
      profile.requestedType ??
      existing?.requestedType ??
      decoded.requestedType ??
      "user",
    termsAcceptedAt: now,
    updatedAt: now,
    ...(existing ? {} : { createdAt: now }),
  });

  const updatedSnap = await userReference.get();
  return updatedSnap.val();
}

/** Updates user profile fields, vitals, emergency contact, or photos while preserving email. */
export async function updateUserProfile(uid, updates) {
  const userReference = userRef(uid);
  const existingSnap = await userReference.get();
  if (!existingSnap.exists()) {
    throw new Error("User not found");
  }

  // Prevent email, uid, or password from being updated
  const {
    email: _email,
    uid: _uid,
    password: _password,
    ...cleanUpdates
  } = updates;

  const now = Date.now();
  const payload = {
    ...cleanUpdates,
    lastSeen: now,
    updatedAt: new Date().toISOString(),
  };

  // Sync photo keys if any photo is passed
  if (cleanUpdates.urlProfile || cleanUpdates.photoURL) {
    const photo = cleanUpdates.urlProfile || cleanUpdates.photoURL;
    payload.urlProfile = photo;
    payload.photoURL = photo;
    payload.urlAvatar =
      cleanUpdates.urlAvatar || cleanUpdates.avatarURL || photo;
    payload.avatarURL = payload.urlAvatar;
  }

  await userReference.update(payload);
  const updatedSnap = await userReference.get();
  return updatedSnap.val();
}

export async function deleteUserData(uid) {
  await userRef(uid).remove();
  // TODO: also delete this user's related data (posts, comments, messages, uploaded files).
}
