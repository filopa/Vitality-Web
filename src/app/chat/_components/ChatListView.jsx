"use client";

import {
  BriefcaseMedical,
  MessageCirclePlus,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/app/_components/dashboard/BottomNav";
import ThemeToggle from "@/app/theme-toggle";
import { useApp } from "@/lib/AppProvider";
import { authedFetch } from "@/lib/client/api";

function formatChatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Avatar component ─────────────────────────────────────────────────────────
function Avatar({ name, photo, online, size = "size-12" }) {
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
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
      )}
    </div>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConversationRow({ conv }) {
  const timeFormatted = formatChatTime(conv.lastMessageTime);

  return (
    <Link
      href={`/chat/${conv.id}`}
      className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <Avatar
        name={conv.peerName}
        photo={conv.peerAvatar}
        online={conv.online}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {conv.peerName}
          </p>
          {timeFormatted && (
            <span className="shrink-0 text-[11px] text-muted">
              {timeFormatted}
            </span>
          )}
        </div>

        {conv.specialty && (
          <p className="text-[11px] font-medium text-primary">
            {conv.specialty}
          </p>
        )}

        <div className="mt-0.5 flex items-center justify-between gap-2">
          {conv.lastMessage ? (
            <p className="truncate text-xs text-muted">{conv.lastMessage}</p>
          ) : (
            <p className="text-xs italic text-muted/80">Start a conversation</p>
          )}

          {conv.unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted hover:text-foreground"
      }`}
    >
      <Icon size={16} />
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            active ? "bg-primary/15 text-primary" : "bg-border text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="relative">
        <div className="grid size-28 place-items-center rounded-full bg-accent">
          <MessageCirclePlus
            size={52}
            strokeWidth={1.3}
            className="text-primary"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 grid size-12 place-items-center rounded-2xl bg-primary/20 shadow-md">
          <BriefcaseMedical size={22} className="text-primary" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-foreground">
          No conversations yet.
        </h2>
        <p className="max-w-xs text-sm text-muted">
          {tab === "doctors"
            ? "Connect with a doctor or follow a specialist anytime for personalized care."
            : "No patient conversations yet. Connected patients will appear here."}
        </p>
      </div>

      <div className="flex gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-500" />
          Specialists Online
        </span>
        <span className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted">
          24/7 Support
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChatListView() {
  const { userData, loading: authLoading } = useApp();
  const isDoctor = userData?.type === "doctor";

  const [activeTab, setActiveTab] = useState(isDoctor ? "patients" : "doctors");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Fetch chats on mount and interval
  useEffect(() => {
    if (authLoading) return;
    if (!userData) {
      setLoadingChats(false);
      return;
    }

    let isMounted = true;

    async function loadChats() {
      try {
        const res = await authedFetch("/api/chat");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setChats(json.data?.chats || []);
          }
        }
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        if (isMounted) setLoadingChats(false);
      }
    }

    loadChats();

    // Poll every 5 seconds for new chats/messages
    const interval = setInterval(loadChats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [authLoading, userData]);

  // Filter into doctors / patients based on active tab
  const tabList = chats.filter((c) =>
    activeTab === "doctors" ? c.peerType === "doctor" : c.peerType !== "doctor",
  );

  const filtered = tabList.filter(
    (c) =>
      c.peerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const doctorCount = chats.filter((c) => c.peerType === "doctor").length;
  const patientCount = chats.filter((c) => c.peerType !== "doctor").length;

  const isLoading = authLoading || loadingChats;

  return (
    <div className="min-h-dvh bg-background font-brand text-foreground antialiased lg:pl-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageCirclePlus size={18} />
            </div>
            <h1 className="text-lg font-bold text-foreground">Chats</h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle showLabel={false} />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-3xl px-5 pb-32 pt-5 sm:px-8 lg:pb-12">
        {/* Search bar */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search in conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border/60 bg-surface py-3 pl-10 pr-12 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            title="Filter"
            className="absolute right-3 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-lg bg-surface text-muted transition hover:bg-accent hover:text-foreground"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mb-5 flex items-center gap-1 rounded-2xl bg-accent/60 p-1">
          <TabButton
            active={activeTab === "patients"}
            onClick={() => setActiveTab("patients")}
            icon={User}
            label="Patients"
            count={patientCount}
          />
          <TabButton
            active={activeTab === "doctors"}
            onClick={() => setActiveTab("doctors")}
            icon={BriefcaseMedical}
            label="Doctors"
            count={doctorCount}
          />
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border/40 bg-surface p-4"
              >
                <div className="size-12 animate-pulse rounded-full bg-accent" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-accent" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-accent" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-surface shadow-sm">
            {filtered.map((conv) => (
              <ConversationRow key={conv.id} conv={conv} />
            ))}
          </div>
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
