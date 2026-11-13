import { NextResponse } from "next/server";
import { AuthError, verifyRequestToken } from "@/lib/server/auth";
import { validateUploadRequest } from "@/lib/server/upload-policy";
import { createUpload } from "@/lib/server/uploads";

const respond = (body, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });

const fail = (status, code, message) => respond({ success: false, code, message }, status);

/**
 * POST /api/upload/presign
 * Body: { kind: "profile-photo" | "cover-photo" | "post-image" | "post-video", contentType, size }
 *   images → data: { provider: "b2",    method: "PUT", uploadUrl, headers, key, publicUrl, expiresIn }
 *   videos → data: { provider: "bunny", videoId, tus: { endpoint, headers }, expiresIn }
 * The browser uploads directly to the provider; this server never touches the file.
 */
export async function POST(request) {
  // ── Half 1: who is asking? (token verification) ────────────────────────────
  let session;
  try {
    session = await verifyRequestToken(request);
  } catch (error) {
    if (error instanceof AuthError) return fail(401, error.code, error.message);
    console.error("Token verification crashed:", error);
    return fail(500, "SERVER_ERROR", "Something went wrong. Please try again.");
  }

  // ── Half 2: what may they upload, and where? ───────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid request body.");
  }

  const check = validateUploadRequest(body);
  if (check.error) return fail(check.error.status, check.error.code, check.error.message);

  try {
    const upload = await createUpload({
      kind: check.kind,
      rule: check.rule,
      uid: session.uid,
      contentType: check.contentType,
      size: check.size,
    });
    return respond({ success: true, data: { kind: check.kind, maxSize: check.rule.maxSize, ...upload } });
  } catch (error) {
    console.error("Creating the upload failed:", error);
    return fail(500, "PRESIGN_FAILED", "Couldn't prepare the upload. Please try again.");
  }
}
