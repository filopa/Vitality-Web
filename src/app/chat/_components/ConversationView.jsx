"use client";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  CornerUpLeft,
  MoreVertical,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "@/app/theme-toggle";
import { useApp } from "@/lib/AppProvider";
import { authedFetch } from "@/lib/client/api";

function formatMessageTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageDate(timestamp) {
  if (!timestamp) return "Today";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = "size-9" }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative shrink-0 overflow-hidden ${size}`}>
      {photo ? (
        <Image
          src={photo}
          alt={name || "Avatar"}
          fill
          unoptimized
          sizes="36px"
          className="rounded-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {initials}
        </div>
      )}
    </div>
  );
}

// ─── Status tick ──────────────────────────────────────────────────────────────
function StatusTick({ seen }) {
  if (seen) {
    return <CheckCheck size={14} className="text-primary" title="Seen" />;
  }
  return <Check size={14} className="text-muted" title="Sent" />;
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isMe, peerName, peerAvatar, onReply }) {
  const timeStr = formatMessageTime(msg.time);

  return (
    <div
      className={`group relative flex items-end gap-2.5 ${
        isMe ? "flex-row-reverse" : ""
      }`}
    >
      {!isMe && <Avatar name={peerName} photo={peerAvatar} size="size-7" />}

      <div
        className={`relative flex flex-col rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
          isMe
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-surface text-foreground border border-border/40"
        }`}
        style={{ maxWidth: 340 }}
      >
        {/* Reply quote banner if this message is replying to another */}
        {msg.reply && (
          <div
            className={`mb-2 rounded-lg border-l-2 py-1 px-2.5 text-xs ${
              isMe
                ? "border-white/80 bg-white/10 text-white/90"
                : "border-primary bg-primary/10 text-muted"
            }`}
          >
            <p className="font-bold text-[11px] opacity-90">
              {msg.reply.senderId === msg.senderId ? "Self" : peerName}
            </p>
            <p className="truncate text-[11px] italic opacity-80">
              {msg.reply.text}
            </p>
          </div>
        )}

        {/* Message text */}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {msg.text}
        </p>

        {/* Footer: time + seen ticks */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
            isMe ? "text-primary-foreground/75" : "text-muted"
          }`}
        >
          <span>{timeStr}</span>
          {isMe && <StatusTick seen={msg.seen} />}
        </div>
      </div>

      {/* Quick Reply Action Button (visible on hover) */}
      <button
        type="button"
        onClick={() => onReply(msg)}
        title="Reply"
        className={`opacity-0 group-hover:opacity-100 transition-opacity grid size-7 place-items-center rounded-full bg-surface border border-border text-muted hover:text-foreground shadow-sm ${
          isMe ? "order-first" : ""
        }`}
      >
        <CornerUpLeft size={13} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ConversationView({ conversationId }) {
  const { userData, loading: authLoading } = useApp();
  const currentUid = userData?.uid;

  const [peer, setPeer] = useState({
    name: "Loading...",
    avatar: "",
    specialty: null,
    type: "user",
    online: false,
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const bottomRef = useRef(null);
  const isInitialLoad = useRef(true);
  const sendingRef = useRef(false);

  // Load conversation data
  const fetchConversation = useCallback(
    async (isPolling = false) => {
      if (!conversationId) return;
      // Never let background polling clobber messages while a send is in-flight
      if (isPolling && sendingRef.current) return;

      try {
        const res = await authedFetch(`/api/chat/${conversationId}`);
        if (!res.ok) return;

        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.peer) {
            setPeer(json.data.peer);
          }
          if (Array.isArray(json.data.messages)) {
            setMessages((prev) => {
              const serverMsgs = json.data.messages;

              // Retain any optimistic messages that haven't shown up in server messages yet
              const pendingOpt = prev.filter(
                (m) =>
                  String(m.id).startsWith("opt-") &&
                  !serverMsgs.some(
                    (srv) =>
                      srv.senderId === m.senderId &&
                      srv.text === m.text &&
                      Math.abs(srv.time - m.time) < 30000,
                  ),
              );

              const merged = [...serverMsgs, ...pendingOpt];

              // Avoid re-renders if messages haven't changed
              if (
                prev.length === merged.length &&
                prev[prev.length - 1]?.id === merged[merged.length - 1]?.id &&
                prev[prev.length - 1]?.seen === merged[merged.length - 1]?.seen
              ) {
                return prev;
              }
              return merged;
            });

            if (isInitialLoad.current) {
              isInitialLoad.current = false;
              setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    if (authLoading) return;
    fetchConversation(false);

    // Live polling every 2.5 seconds
    const interval = setInterval(() => {
      fetchConversation(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [authLoading, fetchConversation]);

  // Send message handler
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Enforce 200 characters limit
    const cleanText = text.slice(0, 200);
    const replyPayload = replyingTo
      ? {
          messageId: replyingTo.id || replyingTo.messageId,
          text: replyingTo.text,
          senderId: replyingTo.senderId,
        }
      : null;

    // Optimistic UI update
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      messageId: optimisticId,
      senderId: currentUid,
      time: Date.now(),
      text: cleanText,
      seen: false,
      reply: replyPayload,
    };

    sendingRef.current = true;
    setSending(true);
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");
    setReplyingTo(null);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await authedFetch(`/api/chat/${conversationId}`, {
        method: "POST",
        body: JSON.stringify({
          text: cleanText,
          reply: replyPayload,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.message) {
        const savedMessage = json.data.message;
        // Seamlessly update optimistic message with saved message in-place
        setMessages((prev) => {
          if (prev.some((m) => m.id === optimisticId)) {
            return prev.map((m) => (m.id === optimisticId ? savedMessage : m));
          }
          if (prev.some((m) => m.id === savedMessage.id)) {
            return prev;
          }
          return [...prev, savedMessage];
        });
      } else {
        // Rollback on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        alert(json.message || "Failed to send message.");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert("Network error while sending message.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background font-brand text-foreground antialiased lg:pl-24">
      {/* ── Conversation header ── */}
      <header className="z-30 shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/chat"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </Link>

          <Avatar name={peer.name} photo={peer.avatar} size="size-10" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {peer.name}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold">
              {peer.online ? (
                <>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-500">ONLINE</span>
                </>
              ) : (
                <span className="text-muted">
                  {peer.specialty ||
                    (peer.type === "doctor" ? "Doctor" : "Patient")}
                </span>
              )}
              {peer.username && (
                <span className="text-muted">· @{peer.username}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle showLabel={false} />
            {peer.uid && (
              <Link
                href={`/profile/${peer.uid}`}
                title="View Profile"
                className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-accent hover:text-foreground"
              >
                <MoreVertical size={20} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Messages area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted gap-2 text-sm">
              <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Send size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Start the conversation
              </h3>
              <p className="max-w-xs text-xs text-muted">
                Say hello to {peer.name}. Messages are encrypted and stored
                securely on Vitality.
              </p>
            </div>
          ) : (
            <>
              {/* Date divider */}
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-accent px-4 py-1 text-[11px] font-semibold text-muted">
                  {formatMessageDate(messages[0]?.time)}
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.senderId === currentUid;
                return (
                  <MessageBubble
                    key={msg.id || msg.messageId}
                    msg={msg}
                    isMe={isMe}
                    peerName={peer.name}
                    peerAvatar={peer.avatar}
                    onReply={(m) => setReplyingTo(m)}
                  />
                );
              })}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input bar ── */}
      <footer className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-3 sm:px-6">
          {/* Replying banner */}
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-foreground">
              <div className="flex items-center gap-2 truncate">
                <CornerUpLeft size={13} className="text-primary shrink-0" />
                <span className="font-semibold text-primary shrink-0">
                  Replying to:
                </span>
                <span className="truncate italic text-muted">
                  {replyingTo.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="ml-2 text-muted hover:text-foreground"
                title="Cancel reply"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Text field */}
            <div className="relative flex-1">
              <textarea
                rows={1}
                maxLength={200}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message (max 200 characters)..."
                className="w-full resize-none rounded-2xl border border-border/60 bg-surface py-2.5 pl-4 pr-16 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ maxHeight: 120 }}
              />

              {/* Character counter (200 char rule) */}
              <span
                className={`absolute right-3.5 bottom-3 text-[10px] font-bold ${
                  input.length >= 190
                    ? "text-rose-500"
                    : input.length >= 150
                      ? "text-amber-500"
                      : "text-muted/60"
                }`}
              >
                {input.length}/200
              </span>
            </div>

            {/* Send */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
