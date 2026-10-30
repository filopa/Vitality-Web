import "server-only";

import {
  createHash,
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import nodemailer from "nodemailer";
import { adminRTDB } from "@/lib/firebase-admin";

const CODE_LENGTH = 5;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFICATION_PATH = "signupVerifications";

function getSecret() {
  const secret = process.env.FIREBASE_PRIVATE_KEY;
  if (!secret) throw new Error("Signup verification secret is not configured.");
  return secret;
}

function getEmailKey(email) {
  return createHash("sha256").update(email).digest("hex");
}

function getCodeHash(email, code) {
  return createHmac("sha256", getSecret())
    .update(`${email}:${code}`)
    .digest("hex");
}

function getRef(normalizedEmail) {
  return adminRTDB.ref(
    `${VERIFICATION_PATH}/${getEmailKey(normalizedEmail)}`,
  );
}

export async function sendSignupVerificationCode(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const ref = getRef(normalizedEmail);

  // Read current record from server (bypasses compat SDK cold-cache null issue)
  const snap = await ref.get();
  const existing = snap.val();

  // Enforce resend cooldown
  if (
    existing &&
    existing.lastSentAt &&
    now - existing.lastSentAt < RESEND_INTERVAL_MS
  ) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.lastSentAt + RESEND_INTERVAL_MS - now) / 1000),
    );
    return { sent: false, retryAfterSeconds };
  }

  const code = String(randomInt(10 ** (CODE_LENGTH - 1), 10 ** CODE_LENGTH));
  const requestId = randomUUID();

  await ref.set({
    email: normalizedEmail,
    codeHash: getCodeHash(normalizedEmail, code),
    expiresAt: now + CODE_TTL_MS,
    lastSentAt: now,
    attempts: 0,
    requestId,
  });

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!host || !Number.isInteger(port) || !user || !pass || !from) {
    await ref.remove();
    throw new Error("SMTP configuration is incomplete.");
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: "Your Vitality verification code",
      text: `Your Vitality verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Vitality verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    });
    return { sent: true };
  } catch (error) {
    await ref.remove();
    throw error;
  }
}

export async function verifySignupVerificationCode(email, code) {
  if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(String(code ?? ""))) {
    return { valid: false, reason: "invalid_format" };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const ref = getRef(normalizedEmail);
  const now = Date.now();
  const expectedHash = Buffer.from(
    getCodeHash(normalizedEmail, String(code)),
    "hex",
  );

  // Read the current record from server first
  const snap = await ref.get();
  const current = snap.val();

  if (!current || current.email !== normalizedEmail) {
    console.warn("Signup verification failed: no active record found for email.");
    return { valid: false, reason: "not_found" };
  }
  if (current.expiresAt <= now) {
    return { valid: false, reason: "expired" };
  }
  if (current.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: "too_many_attempts" };
  }

  const actualHash = Buffer.from(current.codeHash, "hex");
  if (
    actualHash.length !== expectedHash.length ||
    !timingSafeEqual(actualHash, expectedHash)
  ) {
    // Increment attempts counter
    await ref.update({ attempts: current.attempts + 1 });
    return { valid: false, reason: "incorrect" };
  }

  // Mark as verified
  await ref.update({ verifiedAt: now });
  return { valid: true };
}

export async function clearSignupVerificationCode(email) {
  await getRef(email.toLowerCase().trim()).remove();
}
