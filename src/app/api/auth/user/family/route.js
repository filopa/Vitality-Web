import { authenticate, fail, ok } from "@/lib/server/api";
import {
  addFamilyMember,
  getUser,
  removeFamilyMember,
} from "@/lib/server/users";

export async function GET(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  try {
    const user = await getUser(decoded.uid);
    return ok({ family: user?.family || {} });
  } catch (err) {
    console.error("GET /api/auth/user/family error:", err);
    return fail(500, "SERVER_ERROR", "Could not fetch family members.");
  }
}

export async function POST(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_BODY", "Expected valid JSON body.");
  }

  const { username, type } = body || {};
  if (!username || !type) {
    return fail(
      400,
      "VALIDATION_ERROR",
      "Username and relationship type are required.",
    );
  }

  try {
    const updatedFamily = await addFamilyMember(decoded.uid, username, type);
    return ok({
      success: true,
      message: "Family member linked successfully.",
      family: updatedFamily,
    });
  } catch (err) {
    return fail(
      400,
      "FAMILY_ERROR",
      err.message || "Failed to add family member.",
    );
  }
}

export async function DELETE(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  let targetUid;
  const url = new URL(request.url);
  targetUid = url.searchParams.get("targetUid") || url.searchParams.get("id");

  if (!targetUid) {
    try {
      const body = await request.json();
      targetUid = body?.targetUid || body?.id;
    } catch {}
  }

  if (!targetUid) {
    return fail(400, "VALIDATION_ERROR", "targetUid is required.");
  }

  try {
    const updatedFamily = await removeFamilyMember(decoded.uid, targetUid);
    return ok({
      success: true,
      message: "Family member removed successfully.",
      family: updatedFamily,
    });
  } catch (err) {
    return fail(
      400,
      "FAMILY_ERROR",
      err.message || "Failed to remove family member.",
    );
  }
}
