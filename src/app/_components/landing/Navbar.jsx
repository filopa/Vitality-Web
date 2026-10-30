"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/lib/AppProvider";
import { NAV_LINKS } from "@/lib/landing-data";
import Logo from "../Logo";
import ThemeToggle from "../../theme-toggle";
import { I } from "./ui/Icon";
import { Container } from "./ui/primitives";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useApp();
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo href="#home" />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-xs font-medium text-[#0b2a4a] dark:text-slate-200 lg:flex"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="hover:text-[#0b9ab8]">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href={user ? "/home" : "/login"}
            className="rounded-full bg-[#0b9ab8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#08859f]"
          >
            {user ? "Get Started" : "Sign In"}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#0b2a4a] hover:bg-[#e3f4f8] dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            <I name={open ? "close" : "menu"} />
          </button>
        </div>
      </Container>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
        >
          <Container className="grid grid-cols-2 gap-x-4 py-3 sm:grid-cols-3">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className="py-2.5 text-sm font-medium text-[#0b2a4a] hover:text-[#0b9ab8] dark:text-slate-200"
              >
                {label}
              </a>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
