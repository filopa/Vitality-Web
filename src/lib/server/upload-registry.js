import { adminRTDB } from "@/lib/firebase-admin";

/*
 Bunny video ids don't contain the owner (B2 keys do), so we record "videoId → uid" when the upload is created.
 Stored at uploads/bunny/{videoId}. Keep this node closed to clients in your Realtime Database rules
 (the Admin SDK ignores rules).
*/

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ref = (videoId) => adminRTDB.ref(`uploads/bunny/${videoId}`);

export async function registerVideoUpload(videoId, uid) {
  await ref(videoId).set({ uid, createdAt: new Date().toISOString() });
}

/** Returns the videoId only if this user created it, otherwise null. Use it in routes that SAVE a video id. */
export async function getOwnedVideoId(videoId, uid) {
  if (typeof videoId !== "string" || !GUID.test(videoId)) return null;
  const snap = await ref(videoId).get();
  return snap.exists() && snap.val().uid === uid ? videoId : null;
}
