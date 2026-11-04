import { adminRTDB } from "@/lib/firebase-admin";
import { getUser } from "@/lib/server/users";

/**
 * Returns canonical chatId for two UIDs so both users
 * read and write to the same messages node.
 */
export function getChatId(uidA, uidB) {
  if (!uidA || !uidB) return null;
  return [String(uidA).trim(), String(uidB).trim()].sort().join("_");
}

/**
 * Fetches all chats for a given user from chats/{uid}.
 * Enriched with peer type/specialty so tabs (Patients / Doctors) can filter.
 */
export async function getUserChats(uid) {
  if (!uid) return [];

  const chatsSnap = await adminRTDB.ref(`chats/${uid}`).get();
  if (!chatsSnap.exists()) return [];

  const chatsVal = chatsSnap.val(); // { [peerUid]: { chatId, pearId, peerName, peerAvatar, lastMessage, lastMessageTime, unreadCount } }

  const chatList = await Promise.all(
    Object.keys(chatsVal).map(async (peerUid) => {
      const chat = chatsVal[peerUid];
      // Fetch user profile for up-to-date type / specialty
      let peerType = chat.peerType || "user";
      let specialty = null;

      try {
        const peerUser = await getUser(peerUid);
        if (peerUser) {
          peerType = peerUser.type || peerType;
          specialty = peerUser.specialty || null;
        }
      } catch {
        // use stored data if lookup fails
      }

      return {
        id: peerUid,
        chatId: chat.chatId || getChatId(uid, peerUid),
        pearId: chat.pearId || peerUid,
        peerId: peerUid,
        peerName: chat.peerName || "Vitality Member",
        peerAvatar: chat.peerAvatar || "",
        peerType,
        specialty,
        lastMessage: chat.lastMessage || "",
        lastMessageTime: chat.lastMessageTime || 0,
        unreadCount: Number(chat.unreadCount) || 0,
      };
    }),
  );

  // Sort by lastMessageTime descending
  return chatList.sort(
    (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0),
  );
}

/**
 * Loads messages for a conversation and marks messages as seen
 * if they were sent by the other user.
 */
export async function getConversation(currentUid, peerUid) {
  if (!currentUid || !peerUid) throw new Error("Missing user UIDs");

  const chatId = getChatId(currentUid, peerUid);

  // 1) Fetch messages from messages/{chatId}
  const messagesSnap = await adminRTDB.ref(`messages/${chatId}`).get();
  const rawMessages = messagesSnap.exists() ? messagesSnap.val() : {};

  const messages = Object.keys(rawMessages).map((msgId) => ({
    id: msgId,
    messageId: msgId,
    ...rawMessages[msgId],
  }));

  // Sort messages chronologically
  messages.sort((a, b) => (a.time || 0) - (b.time || 0));

  // 2) Mark unseen messages from peer as seen
  const updates = {};
  let hasUnseen = false;

  for (const msg of messages) {
    if (msg.senderId !== currentUid && !msg.seen) {
      updates[`messages/${chatId}/${msg.id}/seen`] = true;
      msg.seen = true;
      hasUnseen = true;
    }
  }

  // Also reset unreadCount for current user on this chat
  updates[`chats/${currentUid}/${peerUid}/unreadCount`] = 0;

  if (hasUnseen || Object.keys(updates).length > 0) {
    await adminRTDB
      .ref()
      .update(updates)
      .catch(() => {});
  }

  // 3) Fetch peer user details for the header
  const peerUser = await getUser(peerUid);
  const peerInfo = {
    uid: peerUid,
    name:
      peerUser?.type === "doctor" &&
      !peerUser?.name?.toLowerCase().startsWith("dr")
        ? `Dr. ${peerUser?.name || "Doctor"}`
        : peerUser?.name || "User",
    username: peerUser?.username || "",
    avatar:
      peerUser?.urlProfile || peerUser?.photoURL || peerUser?.avatarURL || "",
    type: peerUser?.type || "user",
    specialty: peerUser?.specialty || null,
    online: false,
  };

  return {
    chatId,
    peer: peerInfo,
    messages,
  };
}

/**
 * Sends a message from senderUid to recipientUid.
 * Updates:
 * - messages/{chatId}/{messageId}
 * - chats/{senderUid}/{recipientUid}
 * - chats/{recipientUid}/{senderUid}
 */
export async function sendMessage({
  senderUid,
  recipientUid,
  text,
  reply = null,
}) {
  if (!senderUid || !recipientUid) {
    throw new Error("Missing sender or recipient UID.");
  }
  if (senderUid === recipientUid) {
    throw new Error("You cannot send messages to yourself.");
  }

  const cleanText = String(text || "")
    .trim()
    .slice(0, 200);
  if (!cleanText) {
    throw new Error("Message text cannot be empty.");
  }

  const chatId = getChatId(senderUid, recipientUid);
  const now = Date.now();

  // Load sender & recipient profiles
  const [senderUser, recipientUser] = await Promise.all([
    getUser(senderUid),
    getUser(recipientUid),
  ]);

  if (!recipientUser) {
    throw new Error("Recipient user does not exist.");
  }

  // Check recipient's current unread count
  const unreadSnap = await adminRTDB
    .ref(`chats/${recipientUid}/${senderUid}/unreadCount`)
    .get();
  const currentUnread = unreadSnap.exists() ? Number(unreadSnap.val()) || 0 : 0;

  // Generate message ID
  const newMsgRef = adminRTDB.ref(`messages/${chatId}`).push();
  const messageId = newMsgRef.key;

  const messagePayload = {
    senderId: senderUid,
    time: now,
    text: cleanText,
    seen: false,
    reply: reply?.messageId
      ? {
          messageId: String(reply.messageId),
          text: String(reply.text || "").slice(0, 200),
          senderId: String(reply.senderId || ""),
        }
      : null,
  };

  const senderName =
    senderUser?.name || senderUser?.username || "Vitality Member";
  const senderAvatar =
    senderUser?.urlProfile ||
    senderUser?.photoURL ||
    senderUser?.avatarURL ||
    "";
  const recipientName =
    recipientUser?.name || recipientUser?.username || "Vitality Member";
  const recipientAvatar =
    recipientUser?.urlProfile ||
    recipientUser?.photoURL ||
    recipientUser?.avatarURL ||
    "";

  // Atomically update RTDB
  const atomicUpdates = {
    // 1) The message
    [`messages/${chatId}/${messageId}`]: messagePayload,

    // 2) Sender's chat node
    [`chats/${senderUid}/${recipientUid}`]: {
      chatId,
      pearId: recipientUid,
      peerId: recipientUid,
      peerName: recipientName,
      peerAvatar: recipientAvatar,
      peerType: recipientUser.type || "user",
      lastMessage: cleanText,
      lastMessageTime: now,
      unreadCount: 0,
    },

    // 3) Recipient's chat node
    [`chats/${recipientUid}/${senderUid}`]: {
      chatId,
      pearId: senderUid,
      peerId: senderUid,
      peerName: senderName,
      peerAvatar: senderAvatar,
      peerType: senderUser?.type || "user",
      lastMessage: cleanText,
      lastMessageTime: now,
      unreadCount: currentUnread + 1,
    },
  };

  await adminRTDB.ref().update(atomicUpdates);

  return {
    success: true,
    chatId,
    messageId,
    message: {
      id: messageId,
      messageId,
      ...messagePayload,
    },
  };
}
