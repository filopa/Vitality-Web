import { adminRTDB } from "@/lib/firebase-admin";
import { authenticate, fail, ok } from "@/lib/server/api";
import { syncPublicProfile } from "@/lib/server/public-profiles";
import { deleteObject, keyFromPublicUrl, putPublicObject } from "@/lib/server/storage";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024; // the client already shrinks images to ~100 KB

// Don't trust the browser's Content-Type: check the file's real signature.
function detectImageType(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { type: "image/jpeg", ext: "jpg" };
  }
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { type: "image/png", ext: "png" };
  }
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { type: "image/webp", ext: "webp" };
  }
  return null;
}

async function removeOldPhoto(url) {
  const key = keyFromPublicUrl(url);
  if (!key) return;
  try {
    await deleteObject(key);
  } catch (err) {
    console.error("Old avatar cleanup failed:", err); // never fail the request because of cleanup
  }
}

async function loadUser(uid) {
  const ref = adminRTDB.ref(`users/${uid}`);
  const snap = await ref.get();
  return { ref, user: snap.exists() ? snap.val() : null };
}

export async function POST(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  let file;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid upload.");
  }
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return fail(400, "NO_FILE", "Choose an image to upload.");
  }
  if (file.size > MAX_BYTES) return fail(413, "FILE_TOO_LARGE", "Image must be 2 MB or smaller.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = detectImageType(buffer);
  if (!image) return fail(415, "UNSUPPORTED_TYPE", "Use a JPG, PNG, or WebP image.");

  const { ref, user } = await loadUser(decoded.uid);
  if (!user) return fail(404, "PROFILE_NOT_FOUND", "Profile not found.");

  try {
    const photoURL = await putPublicObject(`avatars/${decoded.uid}/${Date.now()}.${image.ext}`, buffer, image.type);
    await ref.update({ photoURL, updatedAt: new Date().toISOString() });
    await syncPublicProfile(decoded.uid);
    await removeOldPhoto(user.photoURL);
    return ok({ photoURL });
  } catch (err) {
    console.error("Avatar upload failed:", err);
    return fail(500, "UPLOAD_FAILED", "Couldn't upload your photo. Please try again.");
  }
}

export async function DELETE(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  const { ref, user } = await loadUser(decoded.uid);
  if (!user) return fail(404, "PROFILE_NOT_FOUND", "Profile not found.");

  try {
    await ref.update({ photoURL: "", updatedAt: new Date().toISOString() });
    await syncPublicProfile(decoded.uid);
    await removeOldPhoto(user.photoURL);
    return ok({ photoURL: "" });
  } catch (err) {
    console.error("Avatar removal failed:", err);
    return fail(500, "REMOVE_FAILED", "Couldn't remove your photo. Please try again.");
  }
}
