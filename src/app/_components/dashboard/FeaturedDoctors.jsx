import Image from "next/image";
import Link from "next/link";
import { DOCTORS, ICONS } from "@/lib/dashboard-data";

import { CARD, SectionHeading } from "./ui/primitives";

function DoctorCard({ doctor }) {
  return (
    <Link href={`/doctors/${doctor.id}`} className={`${CARD} flex gap-4 border border-border/60 p-[17px]`}>
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-primary/10">
        <Image src={doctor.photo} alt={doctor.name} fill sizes="80px" className="object-cover" />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold leading-6 text-foreground">{doctor.name}</h3>
        <p className="text-xs font-semibold leading-4 tracking-[0.05em] text-muted">{doctor.specialty}</p>
        <p className="flex items-center gap-1 text-xs font-semibold leading-4 tracking-[0.05em] text-primary">
          <ICONS.star />
          {doctor.rating} ({doctor.reviews} reviews)
        </p>
        <p className="text-base font-bold leading-6 text-primary">${doctor.price}</p>
      </div>
    </Link>
  );
}

export default function FeaturedDoctors() {
  return (
    <section aria-labelledby="featured-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionHeading id="featured-title">Featured Doctors</SectionHeading>
        <Link href="/doctors" className="text-xs font-semibold tracking-[0.05em] text-primary hover:underline">
          See All
        </Link>
      </div>

      <ul className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
        {DOCTORS.map((doctor) => (
          <li key={doctor.id} className="min-w-[280px] shrink-0 md:min-w-0">
            <DoctorCard doctor={doctor} />
          </li>
        ))}
      </ul>
    </section>
  );
}
