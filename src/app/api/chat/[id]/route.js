import { authenticate, fail, ok } from "@/lib/server/api";
import { getConversation, sendMessage } from "@/lib/server/chats";

function resolvePeerUid(identifier, currentUid) {
  if (!identifier) return null;
  const clean = String(identifier).trim();
  if (clean.includes("_")) {
    const parts = clean.split("_");
    return parts[0] === currentUid ? parts[1] : parts[0];
  }
  return clean;
}

export async function GET(request, { params }) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  const { id } = await params;
  const peerUid = resolvePeerUid(id, decoded.uid);

  if (!peerUid) {
    return fail(400, "INVALID_ID", "Invalid conversation identifier.");
  }

  try {
    const data = await getConversation(decoded.uid, peerUid);
    return ok(data);
  } catch (err) {
    console.error("GET /api/chat/[id] error:", err);
    return fail(
      500,
      "SERVER_ERROR",
      err.message || "Failed to load conversation.",
    );
  }
}

export async function POST(request, { params }) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  const { id } = await params;
  const peerUid = resolvePeerUid(id, decoded.uid);

  if (!peerUid) {
    return fail(400, "INVALID_ID", "Invalid conversation identifier.");
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "INVALID_BODY", "Expected valid JSON body.");
  }

  const { text, reply } = body || {};

  if (!text || !String(text).trim()) {
    return fail(400, "EMPTY_MESSAGE", "Message text is required.");
  }

  try {
    const result = await sendMessage({
      senderUid: decoded.uid,
      recipientUid: peerUid,
      text: String(text).trim().slice(0, 200),
      reply: reply || null,
    });
    return ok(result);
  } catch (err) {
    console.error("POST /api/chat/[id] error:", err);
    return fail(400, "SEND_FAILED", err.message || "Could not send message.");
  }
}
