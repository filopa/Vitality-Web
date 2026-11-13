import { NextResponse } from "next/server";
import { AuthError, verifyRequestToken } from "@/lib/server/auth";
import { searchUsers } from "@/lib/server/user-search";

const respond = (body, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const fail = (status, code, message) =>
  respond({ success: false, code, message }, status);

/**
 * GET /api/users/search?q=ahmed&limit=10
 */
export async function GET(request) {
  let session;

  try {
    session = await verifyRequestToken(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(401, error.code, error.message);
    }

    console.error("Token verification crashed:", error);
    return fail(500, "SERVER_ERROR", "Something went wrong. Please try again.");
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 64);

  const rawLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), 50)
    : 10;

  if (q.length < 2) {
    return respond({
      success: true,
      data: { users: [] },
    });
  }

  try {
    const users = await searchUsers(q, {
      limit,
      excludeUid: session.uid,
    });

    return respond({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("User search failed:", error);
    return fail(500, "SEARCH_FAILED", "Search failed. Please try again.");
  }
}