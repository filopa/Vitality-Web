"use client";

import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authedFetch } from "@/lib/client/api";
import { auth } from "@/lib/firebase";

// Pages that never force the "complete your profile" step.
const EXEMPT_PATHS = ["/", "/login", "/signup", "/register", "/terms", "/privacy", "/complete-profile"];

const isExempt = (pathname) =>
  EXEMPT_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));

/**
 * Renders nothing. Mount once in the root layout:
 * when a signed-in user opens a protected page with an incomplete profile, send them to /complete-profile.
 */
export default function ProfileGate() {
  const pathname = usePathname();
  const router = useRouter();
  const completedUid = useRef(null); // skip re-checking once we know the profile is complete

  useEffect(() => {
    if (isExempt(pathname)) return;

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser || completedUid.current === firebaseUser.uid) return;

      try {
        const res = await authedFetch("/api/auth/user/profile");
        const json = await res.json();
        if (cancelled || !json.success) return;

        if (json.data.profileComplete) completedUid.current = firebaseUser.uid;
        else router.replace("/complete-profile");
      } catch {
        // Network problem: don't lock the user out.
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
