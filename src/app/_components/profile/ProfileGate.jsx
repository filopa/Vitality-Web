"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/AppProvider";
import { getMissingFields } from "@/lib/profile";

// Pages that never force the "complete your profile" step.
const EXEMPT_PATHS = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/terms",
  "/privacy",
  "/complete-profile",
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
  const { user, userData, profileError, loading } = useApp();

  useEffect(() => {
    if (user && ["/login", "/signup", "/register"].includes(pathname)) {
      if (loading || profileError || !userData) return;
      router.replace(
        getMissingFields(userData).length ? "/complete-profile" : "/home",
      );
      return;
    }
    if (isExempt(pathname) || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profileError) return;

    if (userData && getMissingFields(userData).length === 0) {
      return;
    }

    router.replace("/complete-profile");
  }, [pathname, router, user, userData, profileError, loading]);

  return null;
}
