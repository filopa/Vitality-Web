import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { Resend } from "resend";
import { adminRTDB } from "@/lib/firebase-admin";

const CODE_LENGTH = 5;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFICATION_PATH = "signupVerifications";
const TICKET_PATH = "signupVerificationTickets";

function getSecret() {
  const secret = process.env.NEXT_PRIVATE_FIREBASE_PRIVATE_KEY;
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    await ref.remove();
    throw new Error("Resend configuration is incomplete (RESEND_API_KEY or RESEND_FROM missing).");
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: normalizedEmail,
      subject: "Your Vitality verification code",
      text: `Your Vitality verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Vitality verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
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
  const expectedHash = getCodeHash(normalizedEmail, String(code));
  let failureReason = "not_found";
  let verified = false;

  const result = await ref.transaction((current) => {
    failureReason = "not_found";
    verified = false;
    if (!current || current.email !== normalizedEmail) return;
    if (current.expiresAt <= now) {
      failureReason = "expired";
      return;
    }
    if (current.attempts >= MAX_ATTEMPTS) {
      failureReason = "too_many_attempts";
      return;
    }

    const actualHash = Buffer.from(current.codeHash, "hex");
    const expected = Buffer.from(expectedHash, "hex");
    if (
      actualHash.length !== expected.length ||
      !timingSafeEqual(actualHash, expected)
    ) {
      failureReason = "incorrect";
      return { ...current, attempts: current.attempts + 1 };
    }

    verified = true;
    return { ...current, verifiedAt: now };
  });

  if (!verified || !result.committed) {
    return { valid: false, reason: failureReason };
  }
  return { valid: true };
}

export async function clearSignupVerificationCode(email) {
  await getRef(email.toLowerCase().trim()).remove();
}

export async function createSignupVerificationTicket(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const ticket = randomBytes(32).toString("base64url");
  const ticketHash = createHash("sha256").update(ticket).digest("hex");

  await adminRTDB.ref(`${TICKET_PATH}/${ticketHash}`).set({
    email: normalizedEmail,
    expiresAt: Date.now() + CODE_TTL_MS,
  });

  return ticket;
}

export async function claimSignupVerificationTicket(ticket, email, uid) {
  const normalizedEmail = email.toLowerCase().trim();
  const ticketHash = createHash("sha256").update(ticket).digest("hex");
  const ticketRef = adminRTDB.ref(`${TICKET_PATH}/${ticketHash}`);
  const now = Date.now();
  let validForUid = false;

  const result = await ticketRef.transaction((current) => {
    if (
      !current ||
      current.email !== normalizedEmail ||
      current.expiresAt <= now ||
      (current.claimedUid && current.claimedUid !== uid)
    ) {
      return;
    }

    validForUid = true;
    if (current.claimedUid === uid) return current;
    return { ...current, claimedUid: uid, claimedAt: now };
  });

  return validForUid && result.snapshot.exists();
}

export async function completeSignupVerificationTicket(ticket) {
  const ticketHash = createHash("sha256").update(ticket).digest("hex");
  await adminRTDB.ref(`${TICKET_PATH}/${ticketHash}`).remove();
}
