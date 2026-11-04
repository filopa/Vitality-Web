import { authenticate, fail, ok } from "@/lib/server/api";
import { followUser, getFollowing, unfollowUser } from "@/lib/server/users";

/** GET /api/auth/user/follow — returns the list of users the current user follows */
export async function GET(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  try {
    const following = await getFollowing(decoded.uid);
    return ok({ following });
  } catch (err) {
    console.error("GET /api/auth/user/follow error:", err);
    return fail(500, "SERVER_ERROR", "Could not fetch following list.");
  }
}

/** POST /api/auth/user/follow  body: { targetUid } */
export async function POST(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_BODY", "Expected valid JSON body.");
  }

  const { targetUid } = body || {};
  if (!targetUid) {
    return fail(400, "VALIDATION_ERROR", "targetUid is required.");
  }

  try {
    await followUser(decoded.uid, targetUid);
    return ok({ message: "Followed successfully." });
  } catch (err) {
    return fail(400, "FOLLOW_ERROR", err.message || "Could not follow user.");
  }
}

/** DELETE /api/auth/user/follow?targetUid=xxx */
export async function DELETE(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  const url = new URL(request.url);
  const targetUid = url.searchParams.get("targetUid");

  if (!targetUid) {
    return fail(400, "VALIDATION_ERROR", "targetUid query param is required.");
  }

  try {
    await unfollowUser(decoded.uid, targetUid);
    return ok({ message: "Unfollowed successfully." });
  } catch (err) {
    return fail(
      400,
      "UNFOLLOW_ERROR",
      err.message || "Could not unfollow user.",
    );
  }
}

