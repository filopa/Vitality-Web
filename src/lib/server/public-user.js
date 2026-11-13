/**
 * The ONLY user fields that may be sent to other members.
 * Email, phone, birthday, gender, country... never leave the server through the search/batch routes.
 * Need another public field (e.g. bio)? Add it here and every route that returns users picks it up.
 */
export function toPublicUser(uid, user) {
  return {
    uid,
    name: user.name ?? "",
    username: user.username ?? "",
    photoURL: user.photoURL || "",
    type: user.type ?? null,
    verified: Boolean(user.verified),
    specialty: user.specialty ?? null,
  };
}
