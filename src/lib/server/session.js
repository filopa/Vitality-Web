import "server-only";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const SESSION_COOKIE_NAME = "vitality_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function createSessionResponse(idToken, data, status = 200) {
  const decoded = await adminAuth.verifyIdToken(idToken, true);
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
  const response = NextResponse.json(
    { success: true, data: { ...data, uid: decoded.uid } },
    { status },
  );

  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, sessionCookieOptions);
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export function clearLegacyAuthCookie(response) {
  response.cookies.set("vitality_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
