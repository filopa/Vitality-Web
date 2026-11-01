import { adminAuth, adminRTDB } from "@/lib/firebase-admin";

const userRef = (uid) => adminRTDB.ref(`users/${uid}`);

export async function getUser(uid) {
  const snap = await userRef(uid).get();
  if (!snap.exists()) return null;
  const user = snap.val();

  // If real createdAt is missing in RTDB, retrieve real creation time from Firebase Auth
  if (!user.createdAt && uid) {
    try {
      const authUser = await adminAuth.getUser(uid);
      if (authUser?.metadata?.creationTime) {
        user.createdAt = authUser.metadata.creationTime;
        userRef(uid)
          .update({ createdAt: user.createdAt })
          .catch(() => {});
      }
    } catch {
      // Ignore if auth user lookup fails
    }
  }

  if (user.type === "doctor" || user.requestedType === "doctor") {
    try {
      const certSnap = await adminRTDB.ref(`doctorCertificates/${uid}`).get();
      if (certSnap.exists()) {
        const certsVal = certSnap.val();
        user.certificates = Object.keys(certsVal).map((key) => ({
          ...certsVal[key],
          certId: certsVal[key].certId || key,
        }));
      } else {
        user.certificates = [];
      }

      // Map Step 2: Professional Verification fields from certificates.
      // Strategy: first cert created = license cert (required in signup),
      // second cert (if any) = degree cert (optional in signup).
      // Also support title-based matching as fallback.
      const sortedCerts = [...user.certificates].sort(
        (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
      );

      const licenseCert =
        sortedCerts.find((c) => c.title?.toLowerCase().includes("license")) ||
        sortedCerts[0];

      const degreeCert =
        sortedCerts.find(
          (c) =>
            c !== licenseCert &&
            (c.title?.toLowerCase().includes("degree") ||
              c.title?.toLowerCase().includes("m.d.") ||
              c.title?.toLowerCase().includes("bachelor") ||
              c.title?.toLowerCase().includes("mbbs") ||
              c.title?.toLowerCase().includes("mbbch") ||
              c.title?.toLowerCase().includes("diploma")),
        ) || sortedCerts.find((c) => c !== licenseCert);

      // Flat license fields (specialty + licenseNumber already on users/{uid})
      user.licenseIssuer = licenseCert?.issuer || user.licenseIssuer || "";
      user.licenseYear = licenseCert?.issueYear || user.licenseYear || "";
      user.licenseDoc = licenseCert?.mediaUrl?.[0] || user.licenseDoc || "";
      user.licenseStatus =
        licenseCert?.verificationStatus ||
        (user.verified ? "approved" : "padding");

      // Flat degree fields
      user.degreeTitle = degreeCert?.title || user.degreeTitle || "";
      user.degreeIssuer = degreeCert?.issuer || user.degreeIssuer || "";
      user.degreeYear = degreeCert?.issueYear || user.degreeYear || "";
      user.degreeDoc = degreeCert?.mediaUrl?.[0] || user.degreeDoc || "";
      user.degreeStatus =
        degreeCert?.verificationStatus ||
        (user.verified ? "approved" : "padding");
    } catch (err) {
      console.error("Failed to fetch doctor certificates:", err);
      user.certificates = [];
    }
  }

  // Load family node from family/${uid}
  try {
    const familySnap = await adminRTDB.ref(`family/${uid}`).get();
    if (familySnap.exists()) {
      user.family = familySnap.val();
    } else if (!user.family) {
      user.family = {};
    }
  } catch (err) {
    console.error("Failed to fetch user family:", err);
    if (!user.family) user.family = {};
  }

  return user;
}

/** Looks up user by either their Firebase UID or their unique username. */
export async function getUserByIdOrUsername(identifier) {
  if (!identifier || typeof identifier !== "string") return null;
  const cleanId = identifier.trim();

  // 1) Check direct lookup by UID
  const directUser = await getUser(cleanId);
  if (directUser) return directUser;

  // 2) Query by lowercase username
  try {
    const usernameSnap = await adminRTDB
      .ref("users")
      .orderByChild("username")
      .equalTo(cleanId.toLowerCase())
      .limitToFirst(1)
      .get();

    if (usernameSnap.exists()) {
      const val = usernameSnap.val();
      const uid = Object.keys(val)[0];
      return await getUser(uid);
    }
  } catch (err) {
    console.error("Lookup by username failed:", err);
  }

  return null;
}

// Add ".indexOn": ["username"] under "users" in your database rules for fast queries.
export async function isUsernameTaken(username, uid) {
  const snap = await adminRTDB
    .ref("users")
    .orderByChild("username")
    .equalTo(username)
    .limitToFirst(2)
    .get();

  if (!snap.exists()) return false;
  return Object.keys(snap.val()).some((key) => key !== uid);
}

/** Creates the profile if it doesn't exist yet (e.g. Google sign-in that never finished signup). */
export async function saveProfile(decoded, profile) {
  const userReference = userRef(decoded.uid);
  const existingSnap = await userReference.get();
  const existing = existingSnap.exists() ? existingSnap.val() : null;
  const now = new Date().toISOString();

  await userReference.update({
    ...profile,
    email: existing?.email ?? decoded.email ?? "",
    photoURL: existing?.photoURL ?? decoded.picture ?? "",
    avatarURL: existing?.photoURL ?? decoded.picture ?? "",
    requestedType:
      profile.requestedType ??
      existing?.requestedType ??
      decoded.requestedType ??
      "user",
    termsAcceptedAt: now,
    updatedAt: now,
    ...(existing ? {} : { createdAt: now }),
  });

  const updatedSnap = await userReference.get();
  return updatedSnap.val();
}

/** Updates user profile fields, vitals, emergency contact, or photos while preserving email. */
export async function updateUserProfile(uid, updates) {
  const userReference = userRef(uid);
  const existingSnap = await userReference.get();
  if (!existingSnap.exists()) {
    throw new Error("User not found");
  }

  const existingUser = existingSnap.val();

  // Prevent email, uid, or password from being updated
  const {
    email: _email,
    uid: _uid,
    password: _password,
    ...cleanUpdates
  } = updates;

  const now = Date.now();
  const payload = {
    ...cleanUpdates,
    ...((existingUser?.requestedType === "doctor" || cleanUpdates.specialty) &&
    existingUser?.type !== "doctor"
      ? { type: "doctor" }
      : {}),
    lastSeen: now,
    updatedAt: new Date().toISOString(),
  };

  // Sync photo keys if any photo is passed
  if (cleanUpdates.urlProfile || cleanUpdates.photoURL) {
    const photo = cleanUpdates.urlProfile || cleanUpdates.photoURL;
    payload.urlProfile = photo;
    payload.photoURL = photo;
    payload.urlAvatar =
      cleanUpdates.urlAvatar || cleanUpdates.avatarURL || photo;
    payload.avatarURL = payload.urlAvatar;
  }

  await userReference.update(payload);

  // Sync doctor certificates if doctor verification fields are updated
  if (
    (existingUser?.type === "doctor" ||
      existingUser?.requestedType === "doctor") &&
    (cleanUpdates.specialty ||
      cleanUpdates.licenseNumber ||
      cleanUpdates.licenseIssuer ||
      cleanUpdates.licenseYear ||
      cleanUpdates.licenseDoc ||
      cleanUpdates.degreeTitle ||
      cleanUpdates.degreeIssuer ||
      cleanUpdates.degreeYear ||
      cleanUpdates.degreeDoc)
  ) {
    try {
      const certSnap = await adminRTDB.ref(`doctorCertificates/${uid}`).get();
      const certs = certSnap.exists() ? certSnap.val() : {};

      // 1) License record
      let licenseKey = Object.keys(certs).find(
        (k) =>
          certs[k].title?.toLowerCase().includes("license") ||
          (!certs[k].title?.toLowerCase().includes("degree") &&
            certs[k].issuer),
      );
      if (!licenseKey) licenseKey = crypto.randomUUID();

      const specialty =
        cleanUpdates.specialty ||
        existingUser.specialty ||
        "Medical Specialist";
      const licenseIssuer =
        cleanUpdates.licenseIssuer ||
        existingUser.licenseIssuer ||
        certs[licenseKey]?.issuer ||
        "State Medical Licensing Authority";
      const licenseYear =
        cleanUpdates.licenseYear ||
        existingUser.licenseYear ||
        certs[licenseKey]?.issueYear ||
        new Date().getFullYear();
      const licenseDoc =
        cleanUpdates.licenseDoc ||
        existingUser.licenseDoc ||
        certs[licenseKey]?.mediaUrl?.[0] ||
        "license_document.pdf";

      certs[licenseKey] = {
        certId: licenseKey,
        uid,
        title: `Medical License – ${specialty}`,
        issuer: licenseIssuer,
        issueYear: Number(licenseYear) || 0,
        mediaUrl: [licenseDoc],
        isVerified: existingUser.verified ?? false,
        verificationStatus: certs[licenseKey]?.verificationStatus || "padding",
        createdAt: certs[licenseKey]?.createdAt || now,
        updatedAt: now,
      };

      // 2) Degree record (if provided)
      if (
        cleanUpdates.degreeTitle ||
        cleanUpdates.degreeIssuer ||
        cleanUpdates.degreeYear ||
        cleanUpdates.degreeDoc
      ) {
        let degreeKey = Object.keys(certs).find((k) => k !== licenseKey);
        if (!degreeKey) degreeKey = crypto.randomUUID();

        const degreeTitle =
          cleanUpdates.degreeTitle ||
          existingUser.degreeTitle ||
          certs[degreeKey]?.title ||
          "Doctor of Medicine (M.D.)";
        const degreeIssuer =
          cleanUpdates.degreeIssuer ||
          existingUser.degreeIssuer ||
          certs[degreeKey]?.issuer ||
          "Accredited Medical University";
        const degreeYear =
          cleanUpdates.degreeYear ||
          existingUser.degreeYear ||
          certs[degreeKey]?.issueYear ||
          new Date().getFullYear();
        const degreeDoc =
          cleanUpdates.degreeDoc ||
          existingUser.degreeDoc ||
          certs[degreeKey]?.mediaUrl?.[0] ||
          "degree_document.pdf";

        certs[degreeKey] = {
          certId: degreeKey,
          uid,
          title: degreeTitle,
          issuer: degreeIssuer,
          issueYear: Number(degreeYear) || 0,
          mediaUrl: [degreeDoc],
          isVerified: existingUser.verified ?? false,
          verificationStatus: certs[degreeKey]?.verificationStatus || "padding",
          createdAt: certs[degreeKey]?.createdAt || now,
          updatedAt: now,
        };
      }

      await adminRTDB.ref(`doctorCertificates/${uid}`).set(certs);
    } catch (err) {
      console.error(
        "Failed to sync doctor certificates in updateUserProfile:",
        err,
      );
    }
  }

  return await getUser(uid);
}

export async function deleteUserData(uid) {
  await userRef(uid).remove();
  // TODO: also delete this user's related data (posts, comments, messages, uploaded files).
}

export const RECIPROCAL_RELATIONSHIPS = {
  parent: "child",
  child: "parent",
  sibling: "sibling",
  spouse: "spouse",
  grandparent: "grandchild",
  grandchild: "grandparent",
};

export async function addFamilyMember(uidA, targetUsername, relationshipType) {
  if (!uidA || !targetUsername || !relationshipType) {
    throw new Error("Missing required fields (username, type).");
  }

  const cleanType = String(relationshipType).trim().toLowerCase();
  if (!RECIPROCAL_RELATIONSHIPS[cleanType]) {
    throw new Error(
      `Invalid relationship type. Allowed: ${Object.keys(
        RECIPROCAL_RELATIONSHIPS,
      ).join(", ")}`,
    );
  }

  const cleanUsername = String(targetUsername)
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const userB = await getUserByIdOrUsername(cleanUsername);
  if (!userB || !userB.uid) {
    throw new Error(`User with username "@${cleanUsername}" was not found.`);
  }

  if (userB.uid === uidA) {
    throw new Error("You cannot add yourself as a family member.");
  }

  const userA = await getUser(uidA);
  if (!userA) {
    throw new Error("Current user not found.");
  }

  const now = Date.now();
  const reciprocalType = RECIPROCAL_RELATIONSHIPS[cleanType];

  const recordForA = {
    id: userB.uid,
    username: userB.username || cleanUsername,
    name: userB.name || userB.username || "Family Member",
    type: cleanType,
    accepted: true,
    createdAt: now,
  };

  const recordForB = {
    id: userA.uid,
    username: userA.username || "",
    name: userA.name || userA.username || "Family Member",
    type: reciprocalType,
    accepted: true,
    createdAt: now,
  };

  await Promise.all([
    adminRTDB.ref(`family/${uidA}/${userB.uid}`).set(recordForA),
    adminRTDB.ref(`family/${userB.uid}/${uidA}`).set(recordForB),
    adminRTDB.ref(`users/${uidA}/family/${userB.uid}`).set(recordForA),
    adminRTDB.ref(`users/${userB.uid}/family/${uidA}`).set(recordForB),
  ]);

  const updatedSnap = await adminRTDB.ref(`family/${uidA}`).get();
  return updatedSnap.exists() ? updatedSnap.val() : {};
}

export async function removeFamilyMember(uidA, uidB) {
  if (!uidA || !uidB) {
    throw new Error("Missing required IDs for family member removal.");
  }

  await Promise.all([
    adminRTDB.ref(`family/${uidA}/${uidB}`).remove(),
    adminRTDB.ref(`family/${uidB}/${uidA}`).remove(),
    adminRTDB.ref(`users/${uidA}/family/${uidB}`).remove(),
    adminRTDB.ref(`users/${uidB}/family/${uidA}`).remove(),
  ]);

  const updatedSnap = await adminRTDB.ref(`family/${uidA}`).get();
  return updatedSnap.exists() ? updatedSnap.val() : {};
}
