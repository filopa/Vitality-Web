import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function waitForFirebaseUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/** fetch() with a fresh Firebase ID token. Throws Error("NOT_SIGNED_IN") when nobody is signed in. */
export async function authedFetch(url, options = {}) {
  const user = auth.currentUser ?? (await waitForFirebaseUser());
  if (!user) throw new Error("NOT_SIGNED_IN");

  const token = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers, Authorization: `Bearer ${token}` },
  });
}
