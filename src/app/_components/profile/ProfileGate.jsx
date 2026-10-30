"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authedFetch } from "@/lib/client/api";
import { useApp } from "@/lib/AppProvider";

// Pages that never force the "complete your profile" step.
const EXEMPT_PATHS = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/terms",
  "/privacy",
  "/complete-profile",
  "/profile",
];

const isExempt = (pathname) =>
  EXEMPT_PATHS.some((p) =>
    p === "/"
      ? pathname === "/"
      : pathname === p || pathname.startsWith(`${p}/`),
  );

/**
 * Renders nothing. Mount once in the root layout:
 * when a signed-in user opens a protected page with an incomplete profile, send them to /complete-profile.
 */
export default function ProfileGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useApp();
  const completedUid = useRef(null); // skip re-checking once we know the profile is complete

  useEffect(() => {
    if (isExempt(pathname) || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    if (completedUid.current === user.uid) return;

    (async () => {
      try {
        const res = await authedFetch("/api/auth/user/profile");
        const json = await res.json();
        if (cancelled) return;
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok || !json.success) {
          throw new Error(json.message ?? "Profile verification failed.");
        }

        if (json.data.profileComplete) completedUid.current = user.uid;
        else router.replace("/complete-profile");
      } catch (error) {
        if (!cancelled) {
          console.error("Profile verification failed:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, user, loading]);

  return null;
}
