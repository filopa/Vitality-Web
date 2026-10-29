"use client";

import { LogOut, Sparkles, User, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ThemeToggle from "../theme-toggle";

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vitality_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.removeItem("vitality_token");
      localStorage.removeItem("vitality_user");
      document.cookie = "vitality_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2 font-brand font-bold text-xl text-primary">
          <Sparkles className="h-6 w-6" />
          <span>Vitality</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-red-400 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Feed Content */}
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        {/* Welcome Banner */}
        <section className="rounded-2xl border border-primary/20 bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {user?.role === "doctor" ? (
                <Stethoscope className="h-7 w-7" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {user?.name || (user?.role === "doctor" ? "Doctor" : "Member")}!
              </h1>
              <p className="text-sm text-muted">
                Role: <span className="font-semibold text-primary capitalize">{user?.role || "user"}</span>
                {user?.email && ` • ${user.email}`}
              </p>
            </div>
          </div>
        </section>

        {/* Feed Placeholder */}
        <section className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="text-xl font-bold">Your Health Community Feed</h2>
          <p className="mt-2 text-sm text-muted">
            Posts, verified healthcare discussions, and medical updates will appear here.
          </p>
        </section>
      </div>
    </main>
  );
}

