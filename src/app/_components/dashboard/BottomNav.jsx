"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHAT_ITEM, NAV_ITEMS } from "@/lib/dashboard-data";
import ThemeToggle from "@/app/theme-toggle";
const isActive = (pathname, href) =>
  pathname === href || pathname.startsWith(`${href}/`);

function NavItem({ item, active, showLabel, large = false }) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg transition ${
        large ? "h-14 w-16" : "size-[42px]"
      } ${active ? "text-primary" : "text-muted hover:text-foreground"}`}
    >
      <item.icon size={24} strokeWidth={1.8} />
      {showLabel && (
        <span className="text-xs font-medium leading-none">{item.label}</span>
      )}
    </Link>
  );
}

const GLASS = "border border-border/60 bg-surface/70 backdrop-blur-xl";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Phone & tablet: floating pill */}
      <nav
        aria-label="Primary"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 lg:hidden"
      >
        <div
          className={`flex items-center gap-4 rounded-full px-6 py-3 shadow-[0_4px_8px_rgba(0,0,0,0.05)] ${GLASS}`}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <NavItem
                key={item.href}
                item={item}
                active={active}
                showLabel={active}
              />
            );
          })}
        </div>
        <div
          className={`grid size-[66px] place-items-center rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.05)] ${GLASS}`}
        >
          
          <NavItem
            item={CHAT_ITEM}
            active={isActive(pathname, CHAT_ITEM.href)}
          />
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <nav
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 hidden w-24 flex-col items-center gap-2 border-y-0 border-l-0 py-8 lg:flex ${GLASS}`}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            showLabel
            large
          />
        ))}
        <div className="mt-auto flex flex-col items-center  justify-center gap-2 ">

          <div>
            <NavItem
              item={CHAT_ITEM}
              active={isActive(pathname, CHAT_ITEM.href)}
              showLabel
              large
            />
          </div>
        </div>
      </nav>
    </>
  );
}
