import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

export const normalizeFirebasePrivateKey = (value) => {
  if (!value) return value;

  let normalized = String(value).trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");
};

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizeFirebasePrivateKey(
  process.env.FIREBASE_PRIVATE_KEY,
);

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase Admin credentials are missing.");
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

export const adminAuth = getAuth(app);
export const adminRTDB = getDatabase(app);

export const firebaseConfigured = true;

export default app;
