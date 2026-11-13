import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

function normalizePrivateKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
const privateKey = normalizePrivateKey(process.env.NEXT_PUBLIC_NEXT_PRIVATE_FIREBASE_PRIVATE_KEY);
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
  throw new Error(
    "Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL, NEXT_PRIVATE_FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_DATABASE_URL before running the backfill.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
const database = getDatabase(app);
const applyChanges = process.argv.includes("--apply");
const BATCH_SIZE = 200;

function publicProfile(uid, user, followers, following) {
  const isVerifiedDoctor =
    user.type === "doctor" && user.verified === true;

  return {
    uid,
    name: String(user.name ?? ""),
    username: String(user.username ?? ""),
    avatarURL: String(
      user.urlProfile ||
        user.photoURL ||
        user.avatarURL ||
        user.urlAvatar ||
        "",
    ),
    bio: String(user.bio ?? ""),
    type: user.type === "doctor" ? "doctor" : "user",
    verified: isVerifiedDoctor,
    ...(isVerifiedDoctor && user.specialty
      ? { specialty: String(user.specialty) }
      : {}),
    followersCount: Object.keys(followers).length,
    followingCount: Object.keys(following).length,
    showFollowers: user.showFollowers === true,
    createdAt: user.createdAt ?? null,
  };
}

function splitIntoBatches(entries, size) {
  const batches = [];
  for (let index = 0; index < entries.length; index += size) {
    batches.push(entries.slice(index, index + size));
  }
  return batches;
}

const [usersSnapshot, followersSnapshot, followingSnapshot, publicSnapshot] =
  await Promise.all([
    database.ref("users").get(),
    database.ref("followers").get(),
    database.ref("following").get(),
    database.ref("publicProfiles").get(),
  ]);
const users = usersSnapshot.val() ?? {};
const followers = followersSnapshot.val() ?? {};
const following = followingSnapshot.val() ?? {};
const existingPublicProfiles = publicSnapshot.val() ?? {};
const userEntries = Object.entries(users);
const staleProfileUids = Object.keys(existingPublicProfiles).filter(
  (uid) => !Object.hasOwn(users, uid),
);
const updatesByUser = userEntries.map(([uid, user]) => {
  const userFollowers = followers[uid] ?? {};
  const userFollowing = following[uid] ?? {};
  const profile = publicProfile(uid, user, userFollowers, userFollowing);
  const publicFollowers =
    profile.showFollowers && Object.keys(userFollowers).length
      ? Object.fromEntries(Object.keys(userFollowers).map((id) => [id, true]))
      : null;

  return {
    [`users/${uid}/followersCount`]: profile.followersCount,
    [`users/${uid}/followingCount`]: profile.followingCount,
    [`publicProfiles/${uid}`]: profile,
    [`publicFollowers/${uid}`]: publicFollowers,
  };
});

console.log(
  `${applyChanges ? "APPLY" : "DRY RUN"}: ${userEntries.length} user projections; ${staleProfileUids.length} stale public profiles.`,
);
if (staleProfileUids.length) {
  console.log(`Stale public profile UIDs: ${staleProfileUids.slice(0, 10).join(", ")}`);
}

if (!applyChanges) {
  console.log("No data written. Re-run with --apply to commit the backfill.");
  process.exit(0);
}

for (const batch of splitIntoBatches(updatesByUser, BATCH_SIZE)) {
  const updates = Object.assign({}, ...batch);
  for (const uid of staleProfileUids) {
    updates[`publicProfiles/${uid}`] = null;
    updates[`publicFollowers/${uid}`] = null;
  }
  await database.ref().update(updates);
  console.log(`Updated ${batch.length} public profile(s).`);
}

if (updatesByUser.length === 0 && staleProfileUids.length) {
  const staleUpdates = {};
  for (const uid of staleProfileUids) {
    staleUpdates[`publicProfiles/${uid}`] = null;
    staleUpdates[`publicFollowers/${uid}`] = null;
  }
  await database.ref().update(staleUpdates);
}

console.log("Public profile backfill completed.");
