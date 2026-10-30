import Link from "next/link";
import { SHORTCUTS } from "@/lib/dashboard-data";

import { CARD } from "./ui/primitives";

export default function Shortcuts() {
  return (
    <ul className="grid grid-cols-2 gap-4">
      {SHORTCUTS.map(({ label, href, Icon, tint }) => (
        <li key={label}>
          <Link href={href} className={`${CARD} flex h-[72px] items-center gap-3 p-4 transition hover:-translate-y-0.5`}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-full ${tint}`}>
              <Icon />
            </span>
            <span className="text-xs font-semibold tracking-[0.05em] text-foreground">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
