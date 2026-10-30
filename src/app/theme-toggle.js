"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";

export default function ThemeToggle({showLabel = true}) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "light";

    document.documentElement.dataset.theme = initialTheme;
    setTheme(initialTheme);
  }, []);

  function applyTheme(nextTheme) {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  const isDark = theme === "dark";
  const nextThemeLabel = isDark ? "Light mode" : "Dark mode";

  return (
<button
  type="button"
  className={`inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-surface-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${
    showLabel ? "gap-2 px-4 py-2" : "size-10 p-0"
  }`}
  onClick={toggleTheme}
  disabled={theme === null}
  aria-label={`Switch to ${nextThemeLabel.toLowerCase()}`}
  aria-pressed={isDark}
>
  {isDark ? (
    <Sun  strokeWidth={2} className="shrink-0" />
  ) : (
    <Moon  strokeWidth={2} className="shrink-0" />
  )}

  {showLabel && <span>{nextThemeLabel}</span>}
</button>
  );
}
