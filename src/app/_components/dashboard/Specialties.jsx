import Link from "next/link";
import { SPECIALTIES } from "@/lib/dashboard-data";

import { SectionHeading } from "./ui/primitives";

export default function Specialties() {
  return (
    <section aria-labelledby="specialists-title" className="flex flex-col gap-4">
      <SectionHeading id="specialists-title" small>
        Find a Specialist
      </SectionHeading>

      <ul className="flex gap-4 overflow-x-auto pb-2 md:overflow-visible">
        {SPECIALTIES.map(({ slug, label, Icon }) => (
          <li key={slug} className="shrink-0">
            <Link href={`/doctors?specialty=${slug}`} className="group flex min-w-20 flex-col items-center gap-2 px-2">
              <span className="grid size-16 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                <Icon />
              </span>
              <span className="text-xs font-medium tracking-[0.02em] text-foreground">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
