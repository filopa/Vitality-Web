import "server-only";

import { adminRTDB } from "@/lib/firebase-admin";

export function toPublicProfileRecord(uid, user, followersCount, followingCount) {
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
    followersCount,
    followingCount,
    showFollowers: user.showFollowers === true,
    createdAt: user.createdAt ?? null,
  };
}

export async function syncPublicProfile(uid) {
  if (!uid) throw new Error("A user ID is required to sync a public profile.");

  const [userSnapshot, followersSnapshot, followingSnapshot] =
    await Promise.all([
      adminRTDB.ref(`users/${uid}`).get(),
      adminRTDB.ref(`followers/${uid}`).get(),
      adminRTDB.ref(`following/${uid}`).get(),
    ]);

  if (!userSnapshot.exists()) {
    await adminRTDB.ref().update({
      [`publicProfiles/${uid}`]: null,
      [`publicFollowers/${uid}`]: null,
    });
    return null;
  }

  const user = userSnapshot.val();
  const followersCount = followersSnapshot.numChildren();
  const followingCount = followingSnapshot.numChildren();
  const publicProfile = toPublicProfileRecord(
    uid,
    user,
    followersCount,
    followingCount,
  );
  const publicFollowers =
    user.showFollowers === true && followersSnapshot.exists()
      ? Object.fromEntries(
          Object.keys(followersSnapshot.val()).map((followerUid) => [
            followerUid,
            true,
          ]),
        )
      : null;

  await adminRTDB.ref().update({
    [`users/${uid}/followersCount`]: followersCount,
    [`users/${uid}/followingCount`]: followingCount,
    [`publicProfiles/${uid}`]: publicProfile,
    [`publicFollowers/${uid}`]: publicFollowers,
  });

  return publicProfile;
}

export async function getPublicProfileByIdOrUsername(identifier) {
  if (typeof identifier !== "string" || !identifier.trim()) return null;
  const cleanIdentifier = identifier.trim();

  let profileSnapshot = await adminRTDB
    .ref(`publicProfiles/${cleanIdentifier}`)
    .get();

  if (!profileSnapshot.exists()) {
    const usernameSnapshot = await adminRTDB
      .ref("publicProfiles")
      .orderByChild("username")
      .equalTo(cleanIdentifier.toLowerCase())
      .limitToFirst(1)
      .get();

    if (!usernameSnapshot.exists()) return null;
    const profileUid = Object.keys(usernameSnapshot.val())[0];
    profileSnapshot = await adminRTDB
      .ref(`publicProfiles/${profileUid}`)
      .get();
  }

  if (!profileSnapshot.exists()) return null;
  const profileUid = profileSnapshot.key;
  await syncPublicProfile(profileUid);
  profileSnapshot = await adminRTDB
    .ref(`publicProfiles/${profileUid}`)
    .get();
  if (!profileSnapshot.exists()) return null;
  const profile = profileSnapshot.val();

  if (profile.showFollowers) {
    const followersSnapshot = await adminRTDB
      .ref(`publicFollowers/${profile.uid}`)
      .get();
    profile.followers = followersSnapshot.val() ?? {};
  }

  return profile;
}
