"use client";

import { useState } from "react";
import { INSIGHTS } from "@/lib/dashboard-data";

import { CARD, SectionHeading } from "./ui/primitives";

// Green is a semantic "success" color that isn't in global.css, so it uses the Tailwind palette.
const ACCENTS = {
  primary: { border: "border-primary", icon: "text-primary" },
  success: { border: "border-emerald-700", icon: "text-emerald-700" },
};

export default function HealthInsights() {
  const [done, setDone] = useState(() => new Set());
  const markDone = (id) => setDone((prev) => new Set(prev).add(id));

  return (
    <section aria-labelledby="insights-title" className="flex flex-col gap-4">
      <SectionHeading id="insights-title">Health Insights</SectionHeading>

      <ul className="flex flex-col gap-2">
        {INSIGHTS.map(({ id, Icon, accent, title, text, time }) => (
          <li
            key={id}
            className={`${CARD} flex items-center justify-between gap-3 border-l-4 py-4 pl-5 pr-4 ${ACCENTS[accent].border}`}
          >
            <div className="flex items-center gap-3">
              <Icon className={ACCENTS[accent].icon} />
              <div>
                <h3 className="text-base font-bold leading-6 text-foreground">{title}</h3>
                <p className="text-sm leading-5 text-muted">{text}</p>
              </div>
            </div>

            {time ? (
              <span className="shrink-0 text-sm leading-5 text-muted">{time}</span>
            ) : (
              <button
                type="button"
                onClick={() => markDone(id)}
                disabled={done.has(id)}
                className="shrink-0 text-sm font-bold leading-5 text-primary transition hover:underline disabled:text-muted disabled:no-underline"
              >
                {done.has(id) ? "✓ Done" : "Done"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
