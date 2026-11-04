import { authenticate, fail, ok } from "@/lib/server/api";
import { getUserChats } from "@/lib/server/chats";
import { getFollowing } from "@/lib/server/users";

export async function GET(request) {
  const { decoded, error } = await authenticate(request);
  if (error) return error;

  try {
    const [chats, following] = await Promise.all([
      getUserChats(decoded.uid),
      getFollowing(decoded.uid),
    ]);

    // Map existing chat peer IDs
    const existingPeerIds = new Set(chats.map((c) => c.peerId || c.pearId));

    // For any followed user without an existing chat, append as contact
    const followedContacts = following
      .filter((f) => !existingPeerIds.has(f.uid))
      .map((f) => ({
        id: f.uid,
        chatId: null,
        pearId: f.uid,
        peerId: f.uid,
        peerName: f.name,
        peerAvatar: f.photo || "",
        peerType: f.type || "user",
        specialty: f.specialty || null,
        lastMessage: "",
        lastMessageTime: f.followedAt || 0,
        unreadCount: 0,
        isFollowedContact: true,
      }));

    const allChats = [...chats, ...followedContacts];

    return ok({ chats: allChats });
  } catch (err) {
    console.error("GET /api/chat error:", err);
    return fail(500, "SERVER_ERROR", "Could not load chats.");
  }
}

