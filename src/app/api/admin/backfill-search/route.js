import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminRTDB } from "@/lib/firebase-admin";
import { buildSearchFields } from "@/lib/server/user-search";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ONE-TIME TASK. Adds the search fields to users that were created before search existed.
 *   1) set ADMIN_TASK_SECRET in .env.local (any long random string)
 *   2) curl -X POST http://localhost:3000/api/admin/backfill-search -H "Authorization: Bearer <secret>"
 *   3) DELETE this file afterwards.
 */
export async function POST(request) {
  const secret = process.env.ADMIN_TASK_SECRET;
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");

  const authorized =
    Boolean(secret) && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!authorized) return new NextResponse(null, { status: 404 }); // pretend the route doesn't exist

  const snap = await adminRTDB.ref("users").get();
  const entries = snap.exists() ? Object.entries(snap.val()) : [];

  let updated = 0;
  for (let i = 0; i < entries.length; i += 300) {
    const updates = {};
    for (const [uid, user] of entries.slice(i, i + 300)) {
      for (const [field, value] of Object.entries(buildSearchFields(user))) {
        updates[`users/${uid}/${field}`] = value;
      }
      updated++;
    }
    await adminRTDB.ref().update(updates);
  }

  return NextResponse.json({ success: true, data: { updated } });
}
