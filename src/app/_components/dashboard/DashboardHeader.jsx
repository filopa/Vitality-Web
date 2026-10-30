"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/AppProvider";
import { ICONS } from "@/lib/dashboard-data";
import ThemeToggle from "@/app/theme-toggle";

function getGreeting(hour) {
  if (hour < 12) return "Good Morning,";
  if (hour < 18) return "Good Afternoon,";
  return "Good Evening,";
}

export default function DashboardHeader() {
  const { user, userData } = useApp();
  const [greeting, setGreeting] = useState("Hello,"); // real greeting is set on the client (user's timezone)

  useEffect(() => setGreeting(getGreeting(new Date().getHours())), []);

  const name = userData?.name ?? "there";

  return (
    <header className="sticky top-0 z-30 bg-background/80 shadow-[0_4px_20px_rgba(15,23,42,0.05)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-primary/20 font-semibold text-primary">
            {userData?.photoURL ? (
              <Image
                src={userData?.photoURL}
                alt=""
                fill
                sizes="40px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <span aria-hidden="true">{name[0]?.toUpperCase()}</span>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs font-semibold leading-4 tracking-[0.05em] text-muted">
              {greeting}
            </p>
            <h1 className="text-xl font-semibold leading-7 text-primary">
              {name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <ThemeToggle showLabel={false} />
          </div>
          <div>
            {" "}
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="flex size-10 bg-surface shadow-[0_4px_20px_rgba(15,23,42,0.05)] background/80 items-center justify-center rounded-full text-foreground transition hover:bg-primary/10"
            >
              <ICONS.bell />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
