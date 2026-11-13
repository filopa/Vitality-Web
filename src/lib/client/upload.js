import { authedFetch } from "@/lib/client/api";

function putToB2({ uploadUrl, headers, file, onProgress, signal }) {
  // XMLHttpRequest (not fetch) because it reports upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again."));
    xhr.onerror = () => reject(new Error("Network error during upload. Please try again."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    xhr.send(file);
  });
}

async function tusToBunny({ tus, file, onProgress, signal }) {
  const { Upload } = await import("tus-js-client"); // loaded only when a video is uploaded

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: tus.endpoint,
      headers: tus.headers,
      metadata: { filetype: file.type },
      retryDelays: [0, 3000, 5000, 10000, 20000],
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onError: () => reject(new Error("Video upload failed. Please try again.")),
      onSuccess: () => resolve(),
    });

    signal?.addEventListener(
      "abort",
      () => {
        upload.abort(true);
        reject(new DOMException("Upload cancelled", "AbortError"));
      },
      { once: true },
    );

    upload.start();
  });
}

/**
 * Uploads straight from the browser. kind: "profile-photo" | "cover-photo" | "post-image" | "post-video"
 *   images → { provider: "b2",    key, publicUrl }
 *   videos → { provider: "bunny", videoId }
 * Then send that result to the backend route that saves the profile/post. That route MUST verify ownership
 * (getOwnedKey for images, getOwnedVideoId for videos).
 */
export async function uploadToStorage({ kind, file, onProgress, signal }) {
  const res = await authedFetch("/api/upload/presign", {
    method: "POST",
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message ?? "Couldn't start the upload.");

  const data = json.data;

  if (data.provider === "bunny") {
    await tusToBunny({ tus: data.tus, file, onProgress, signal });
    onProgress?.(100);
    return { provider: "bunny", videoId: data.videoId };
  }

  await putToB2({ uploadUrl: data.uploadUrl, headers: data.headers, file, onProgress, signal });
  onProgress?.(100);
  return { provider: "b2", key: data.key, publicUrl: data.publicUrl };
}
