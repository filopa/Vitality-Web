import { adminRTDB } from "@/lib/firebase-admin";
import { authenticate } from "@/lib/server/api";
import { syncPublicProfile } from "@/lib/server/public-profiles";

export async function POST(request) {
  const authenticated = await authenticate(request, { allowMissingProfile: true });
  if (authenticated.error) return authenticated.error;

  const { decoded } = authenticated;
  if (
    decoded.firebase?.sign_in_provider !== "google.com" ||
    !decoded.email ||
    decoded.email_verified !== true
  ) {
    return Response.json(
      {
        success: false,
        code: "INVALID_PROVIDER",
        message: "A verified Google account is required.",
      },
      { status: 401 },
    );
  }

  const uid = decoded.uid;
  const userRef = adminRTDB.ref(`users/${uid}`);
  try {
    const existingSnapshot = await userRef.get();
    let isNew = false;

    if (!existingSnapshot.exists()) {
      const userRecord = {
        uid,
        name: decoded.name ?? "",
        email: decoded.email.toLowerCase(),
        username: "",
        phone: "",
        country: "",
        gender: "",
        birthday: "",
        bio: "",
        avatarURL: decoded.picture ?? "",
        photoURL: decoded.picture ?? "",
        type: "user",
        active: true,
        lastSeen: Date.now(),
        family: {},
      };

      await userRef.transaction((current) => {
        isNew = !current;
        return current ?? userRecord;
      });
    } else {
      await userRef.update({ lastSeen: Date.now(), active: true });
    }

    await syncPublicProfile(uid);
    return Response.json({
      success: true,
      data: { uid, role: authenticated.role ?? "user", isNew },
    });
  } catch (error) {
    console.error("Google-authenticated profile setup failed:", error);
    return Response.json(
      {
        success: false,
        code: "PROFILE_SETUP_FAILED",
        message: "We couldn't finish setting up your account. Please try again.",
      },
      { status: 500 },
    );
  }
}
