"use client";

import { signOut } from "firebase/auth";
import { useState } from "react";
import { authedFetch } from "@/lib/client/api";
import { auth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/client/session";

async function endSession() {
  await signOut(auth).catch(() => {});
  clearStoredSession();
  window.location.assign("/");
}

export function AccountActions() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await authedFetch("/api/user", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      await endSession();
    } catch (err) {
      setError(err.message || "We couldn't delete your account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 text-sm">
      {!confirming ? (
        <div className="flex items-center gap-4 text-muted">
          <button type="button" onClick={endSession} className="hover:text-foreground hover:underline">
            Sign out
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="font-medium text-red-500 hover:underline"
          >
            Delete account
          </button>
        </div>
      ) : (
        <div role="alertdialog" aria-labelledby="delete-title" className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950/40">
          <p id="delete-title" className="font-semibold text-red-700 dark:text-red-300">
            Delete your account?
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            This permanently deletes your account and data. It can&apos;t be undone.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="mt-3 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-surface-foreground disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
