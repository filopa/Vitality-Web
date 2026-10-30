import Link from "next/link";
import { CONSULTATIONS, ICONS } from "@/lib/dashboard-data";

import { CARD, SectionHeading } from "./ui/primitives";

export default function RecentConsultations() {
  return (
    <section aria-labelledby="consultations-title" className="flex flex-col gap-4">
      <SectionHeading id="consultations-title">Recent Consultations</SectionHeading>

      <ul className="flex flex-col gap-3">
        {CONSULTATIONS.map(({ id, doctor, specialty, status, date }) => (
          <li key={id} className={`${CARD} flex flex-col gap-3 p-4`}>
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <ICONS.consult />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-6 text-foreground">{doctor}</h3>
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">{specialty}</p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[10px] font-bold leading-[15px] text-emerald-700">
                {status}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-[13px]">
              <p className="text-sm leading-5 text-muted">{date}</p>
              <Link href={`/consultations/${id}`} className="flex items-center gap-1 text-sm font-bold leading-5 text-primary hover:underline">
                Summary
                <ICONS.arrowRight />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
