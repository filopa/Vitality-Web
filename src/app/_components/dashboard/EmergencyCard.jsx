import Link from "next/link";
import { ICONS } from "@/lib/dashboard-data";

// Red is a semantic "danger" color that isn't in global.css, so it uses the Tailwind palette.
export default function EmergencyCard() {
  return (
    <Link
      href="/emergency"
      className="flex items-center justify-between gap-4 rounded-2xl border border-red-600/10 bg-red-600/5 p-[25px] transition hover:bg-red-600/10"
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-red-700 text-white">
          <ICONS.ambulance />
        </span>
        <div>
          <h2 className="text-base font-bold leading-6 text-red-700">Request Ambulance</h2>
          <p className="text-sm leading-5 text-muted">Immediate medical assistance</p>
        </div>
      </div>
      <ICONS.chevronRight className="text-red-700" />
    </Link>
  );
}
