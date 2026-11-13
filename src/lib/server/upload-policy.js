import { randomUUID } from "node:crypto";
import { keyFromPublicUrl } from "./storage";

const MB = 1024 * 1024;

const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const VIDEO_TYPES = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };

/**
 * One entry per upload kind. Add new kinds here; nothing else needs to change.
 *   provider "b2"    → presigned PUT to Backblaze B2 (images). `prefix` is the folder in the bucket.
 *   provider "bunny" → TUS upload to Bunny Stream (videos).
 */
export const UPLOAD_KINDS = {
  "profile-photo": { provider: "b2", prefix: "avatars", types: IMAGE_TYPES, maxSize: 2 * MB },
  "cover-photo": { provider: "b2", prefix: "covers", types: IMAGE_TYPES, maxSize: 5 * MB },
  "post-image": { provider: "b2", prefix: "posts/images", types: IMAGE_TYPES, maxSize: 10 * MB },
  "post-video": { provider: "bunny", types: VIDEO_TYPES, maxSize: 200 * MB },
};

const reject = (status, code, message) => ({ error: { status, code, message } });

/** Validates { kind, contentType, size } against the rules. Returns { kind, rule, contentType, size } or { error }. */
export function validateUploadRequest(body) {
  const { kind, contentType, size } = body ?? {};

  if (typeof kind !== "string" || !Object.hasOwn(UPLOAD_KINDS, kind)) {
    return reject(400, "INVALID_KIND", "Unknown upload type.");
  }
  const rule = UPLOAD_KINDS[kind];

  if (typeof contentType !== "string" || !Object.hasOwn(rule.types, contentType)) {
    return reject(415, "UNSUPPORTED_TYPE", `This file type isn't allowed for ${kind}.`);
  }
  if (!Number.isInteger(size) || size <= 0) {
    return reject(400, "INVALID_SIZE", "File size is missing or invalid.");
  }
  if (size > rule.maxSize) {
    return reject(413, "FILE_TOO_LARGE", `File must be ${Math.floor(rule.maxSize / MB)} MB or smaller.`);
  }

  return { kind, rule, contentType, size };
}

/** e.g. avatars/<uid>/1730000000000-<uuid>.jpg. The extension comes from the allowed type, never from the file name. */
export function buildObjectKey(kind, uid, contentType) {
  const rule = UPLOAD_KINDS[kind];
  return `${rule.prefix}/${uid}/${Date.now()}-${randomUUID()}.${rule.types[contentType]}`;
}

/**
 * B2 kinds only (images). Use it in the routes that SAVE an uploaded file's URL (profile, post, ...):
 * returns the storage key only if the URL points at this user's own upload of this kind.
 * For videos use getOwnedVideoId() from upload-registry.js.
 */
export function getOwnedKey(url, kind, uid) {
  if (!Object.hasOwn(UPLOAD_KINDS, kind) || UPLOAD_KINDS[kind].provider !== "b2") return null;
  const key = keyFromPublicUrl(url);
  const ownPrefix = `${UPLOAD_KINDS[kind].prefix}/${uid}/`;
  return key && key.startsWith(ownPrefix) && !key.includes("..") ? key : null;
}
