import { createBunnyUpload, deleteBunnyVideo } from "./bunny";
import { createPresignedPut } from "./storage";
import { registerVideoUpload } from "./upload-registry";
import { buildObjectKey } from "./upload-policy";

/**
 * Returns what the browser needs to upload:
 *   B2:    { provider: "b2", method: "PUT", uploadUrl, headers, key, publicUrl, expiresIn }
 *   Bunny: { provider: "bunny", videoId, tus: { endpoint, headers }, expiresIn }
 */
export async function createUpload({ kind, rule, uid, contentType, size }) {
  if (rule.provider === "bunny") {
    const upload = await createBunnyUpload({ title: `${uid}-${Date.now()}` });
    try {
      await registerVideoUpload(upload.videoId, uid);
    } catch (error) {
      await deleteBunnyVideo(upload.videoId).catch(() => {}); // don't leave an orphan video behind
      throw error;
    }
    return upload;
  }

  const key = buildObjectKey(kind, uid, contentType);
  const upload = await createPresignedPut({ key, contentType, size });
  return { provider: "b2", method: "PUT", key, ...upload };
}
