"use client";

import { EyeClosed,Eye } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";

/**
 * icon: { src: string, width: number, height: number }
 * revealable: adds the show/hide toggle (use with type="password")
 * error: error message string
 */
export function InputField({
  label,
  icon,
  revealable = false,
  error,
  type = "text",
  className = "",
  ...props
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const inputType = revealable && visible ? "text" : type;

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted"
      >
        {label}
      </label>

      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-[15px] flex items-center text-muted"
        >
          {icon}
        </span>

        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-[58px] w-full rounded-xl border bg-surface ps-[49px] pe-[49px] text-base text-surface-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 ${
            error ? "border-red-500" : "border-border"
          } ${className}`}
          {...props}
        />

        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 end-[15px] flex items-center rounded-md text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {visible ? (
              /* "Eye open" state is not in the Figma file, so it's a simple inline icon */
              <Eye/>
            ) : (
              <EyeClosed />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
