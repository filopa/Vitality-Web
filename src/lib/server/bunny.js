import { createHash } from "node:crypto";

/*
 Env vars (server only):
   BUNNY_STREAM_LIBRARY_ID   Stream → your library → "Library ID"
   BUNNY_STREAM_API_KEY      The library's API key (NOT the account key). Never expose it to the browser.
*/

const API_BASE = "https://video.bunnycdn.com";
const TUS_ENDPOINT = `${API_BASE}/tusupload`;

// The browser re-sends these headers with every chunk, so the signature must outlive the whole upload.
export const BUNNY_UPLOAD_TTL_SECONDS = 2 * 60 * 60;

function getConfig() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId || !apiKey) throw new Error("Bunny Stream env vars are missing.");
  return { libraryId, apiKey };
}

/** Creates an empty video object in the library and returns its id (guid). */
export async function createBunnyVideo(title) {
  const { libraryId, apiKey } = getConfig();
  const res = await fetch(`${API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: { AccessKey: apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Bunny: creating the video failed (${res.status}).`);

  const video = await res.json();
  if (!video?.guid) throw new Error("Bunny: response had no video id.");
  return video.guid;
}

/**
 * Credentials for a browser-side TUS upload of ONE specific video.
 * signature = SHA256(libraryId + apiKey + expire + videoId)  (the API key itself never leaves the server)
 */
export function signTusUpload(videoId, now = Date.now()) {
  const { libraryId, apiKey } = getConfig();
  const expire = Math.floor(now / 1000) + BUNNY_UPLOAD_TTL_SECONDS;
  const signature = createHash("sha256").update(`${libraryId}${apiKey}${expire}${videoId}`).digest("hex");

  return {
    endpoint: TUS_ENDPOINT,
    headers: {
      AuthorizationSignature: signature,
      AuthorizationExpire: String(expire),
      VideoId: videoId,
      LibraryId: libraryId,
    },
  };
}

export async function createBunnyUpload({ title }) {
  const videoId = await createBunnyVideo(title);
  return { provider: "bunny", videoId, tus: signTusUpload(videoId), expiresIn: BUNNY_UPLOAD_TTL_SECONDS };
}

export async function deleteBunnyVideo(videoId) {
  const { libraryId, apiKey } = getConfig();
  const res = await fetch(`${API_BASE}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Bunny: deleting the video failed (${res.status}).`);
}
