"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";

export default function ThemeToggle() {
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
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-surface-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={toggleTheme}
      disabled={theme === null}
      aria-label={`Switch to ${nextThemeLabel.toLowerCase()}`}
      aria-pressed={isDark}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      <span>{nextThemeLabel}</span>
    </button>
  );
}
