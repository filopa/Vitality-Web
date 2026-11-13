import { NextResponse } from "next/server";
import { AuthError, verifyRequestToken } from "@/lib/server/auth";
import { getPublicUsers, parseUidList } from "@/lib/server/user-lookup";




const respond = (body, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
const fail = (status, code, message) => respond({ success: false, code, message }, status);

/**
 * POST /api/users/batch
 * Body:    { "uids": ["uid1", "uid2", ...] }          (1–50 uids)
 * Returns: { success, data: { users: [...], missing: [...] } }
 */
export async function POST(request) {
  // ── Half 1: who is asking? ─────────────────────────────────────────────────
  try {
    await verifyRequestToken(request);
  } catch (error) {
    if (error instanceof AuthError) return fail(401, error.code, error.message);
    console.error("Token verification crashed:", error);
    return fail(500, "SERVER_ERROR", "Something went wrong. Please try again.");
  }

  // ── Half 2: look the users up ──────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "BAD_REQUEST", "Invalid request body.");
  }

  const parsed = parseUidList(body?.uids);
  if (parsed.error) return fail(parsed.status, "INVALID_UIDS", parsed.error);

  try {
    const { users, missing } = await getPublicUsers(parsed.uids);
    return respond({ success: true, data: { users, missing } });
  } catch (error) {
    console.error("Batch user lookup failed:", error);
    return fail(500, "LOOKUP_FAILED", "Couldn't load users. Please try again.");
  }
}
