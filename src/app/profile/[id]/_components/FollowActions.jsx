"use client";

import { Check, MessageCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/AppProvider";
import { authedFetch } from "@/lib/client/api";

/**
 * Shown on /profile/[id] — handles Follow / Unfollow and Message buttons.
 *
 * Props:
 *   targetUid   — UID of the profile being viewed
 *   targetName  — Display name (for button labels)
 *   isDoctor    — Boolean — changes CTA copy
 */
export default function FollowActions({ targetUid, targetName, isDoctor }) {
  const router = useRouter();
  const { user, loading } = useApp();

  const [following, setFollowing] = useState(false);
  const [checking, setChecking] = useState(true); // true while we verify follow state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // On mount — if signed in, check whether we already follow this user
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await authedFetch("/api/auth/user/follow");
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.following ?? [];
          setFollowing(list.some((f) => f.uid === targetUid));
        }
      } catch {
        // ignore — just show the default state
      } finally {
        setChecking(false);
      }
    })();
  }, [loading, user, targetUid]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const requireAuth = (_action) => {
    if (!user) {
      // Redirect to login, come back after
      router.push(`/login?next=/profile/${targetUid}`);
      return false;
    }
    if (user.uid === targetUid) {
      showToast("That's your own profile!");
      return false;
    }
    return true;
  };

  const handleFollow = async () => {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      const res = await authedFetch("/api/auth/user/follow", {
        method: "POST",
        body: JSON.stringify({ targetUid }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setFollowing(true);
      showToast(`You are now following ${targetName}!`);
    } catch (err) {
      showToast(err.message || "Could not follow. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnfollow = async () => {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      const res = await authedFetch(
        `/api/auth/user/follow?targetUid=${targetUid}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setFollowing(false);
      showToast(`Unfollowed ${targetName}.`);
    } catch (err) {
      showToast(err.message || "Could not unfollow. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMessage = () => {
    if (!user) {
      router.push(`/login?next=/profile/${targetUid}`);
      return;
    }
    router.push(`/chat/${targetUid}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  // While checking follow state just render placeholders to avoid layout shift
  const busy = checking || saving;

  return (
    <div className="flex flex-col gap-2">
      {/* Action row */}
      <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
        {/* Primary: Follow / Following / Book */}
        {isDoctor ? (
          <button
            type="button"
            onClick={() =>
              user
                ? router.push(`/chat?with=${targetUid}`)
                : router.push("/signup?as=patient")
            }
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
          >
            Book Consultation
          </button>
        ) : following ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleUnfollow}
            className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-xs font-bold text-primary transition hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-60"
          >
            {busy ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Check size={13} />
                Following
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleFollow}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <UserPlus size={13} />
                {user ? "Follow" : "Connect on Vitality"}
              </>
            )}
          </button>
        )}

        {/* Secondary: Message */}
        <button
          type="button"
          onClick={handleMessage}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
        >
          <MessageCircle size={13} />
          {user ? "Message" : "Send Message"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <p className="text-[11px] font-semibold text-primary animate-in fade-in slide-in-from-bottom-1 duration-200">
          {toast}
        </p>
      )}
    </div>
  );
}
