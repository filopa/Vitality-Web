"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { searchUsers } from "@/lib/client/user-search";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

function Avatar({ user }) {
  return (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/20 text-sm font-semibold text-primary">
      {user.photoURL ? (
        <Image src={user.photoURL} alt="" fill sizes="36px" unoptimized className="object-cover" />
      ) : (
        <span aria-hidden="true">{(user.name || user.username || "?")[0].toUpperCase()}</span>
      )}
    </span>
  );
}

/**
 * <UserSearchBox onSelect={(user) => ...} />
 * `user.uid` is the selected member's id.
 */
export function UserSearchBox({
  onSelect,
  placeholder = "Search by name, username",
  limit = 10,
  clearOnSelect = false,
  autoFocus = false,
}) {
  const listId = useId();
  const skipNextSearch = useRef(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  // Debounced search; the previous request is cancelled when the text changes.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const text = query.trim();
    if (text.length < MIN_CHARS) {
      setResults([]);
      setStatus("idle");
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const users = await searchUsers(text, { limit, signal: controller.signal });
        setResults(users);
        setActive(users.length > 0 ? 0 : -1);
        setStatus("done");
        setOpen(true);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setStatus("error");
        setOpen(true);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit]);

  function choose(user) {
    const next = clearOnSelect ? "" : user.name || `@${user.username}`;
    skipNextSearch.current = next !== query; // changing the text below must not trigger a new search
    setQuery(next);
    setOpen(false);
    setResults([]);
    setActive(-1);
    onSelect?.(user);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && results.length > 0) return setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label="Search members"
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setOpen(false)}
        className="h-12 w-full rounded-full border border-border bg-surface px-5 text-base text-surface-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-surface p-1 shadow-lg"
        >
          {status === "error" && <li className="px-4 py-3 text-sm text-red-500">Search failed. Please try again.</li>}
          {status === "done" && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">No members found.</li>
          )}

          {results.map((user, index) => (
            <li
              key={user.uid}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown (not click) so the input keeps focus and onBlur doesn't close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(user);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${
                index === active ? "bg-primary/10" : ""
              }`}
            >
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user.name || user.username}</p>
                <p className="truncate text-xs text-muted">
                  @{user.username}
                  {(user.matchedBy === "email" || user.matchedBy === "phone") && ` · matched by ${user.matchedBy}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="sr-only">
        {status === "loading" ? "Searching…" : ""}
      </p>
    </div>
  );
}
