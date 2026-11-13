import { adminAuth } from "@/lib/firebase-admin";
import { authenticate, fail, ok } from "@/lib/server/api";
import { deleteUserData } from "@/lib/server/users";

export async function DELETE(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  try {
    // Data first, auth account last: if this fails halfway, the user can simply retry.
    await deleteUserData(decoded.uid);
    await adminAuth.deleteUser(decoded.uid);
    return ok({ deleted: true });
  } catch (err) {
    console.error("Delete account failed:", err);
    return fail(500, "DELETE_FAILED", "We couldn't delete your account. Please try again.");
  }
}
