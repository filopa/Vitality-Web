import { DOCTOR_POINTS, IMG } from "@/lib/landing-data";
import { Button, Container, Heading, Photo, PointList, Section, SECTION_Y } from "./ui/primitives";

export default function Doctors() {
  return (
    <Section
      id="doctors"
      labelledBy="doctors-title"
      className={`bg-gradient-to-r from-white via-[#f7fcfd] to-[#eef8fb] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${SECTION_Y}`}
    >
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-x-10 lg:grid-cols-[0.9fr_1fr_1fr] lg:gap-x-12">
        <Photo
          src={IMG.doctor}
          alt="Smiling doctor in a modern clinic"
          sizes="(min-width: 1024px) 30vw, 45vw"
          className="hidden min-h-[280px] rounded-3xl md:row-span-2 md:block md:h-full lg:row-span-1 lg:min-h-[340px]"
        />

        <div>
          <Heading id="doctors-title">
            A Space for
            <br className="hidden sm:block" /> Healthcare Professionals.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Build your professional profile, connect with colleagues, share knowledge, and be part of a supportive
            medical community.
          </p>
          <div className="mt-6">
            <Button href="/signup/doctor">Join as a Doctor</Button>
          </div>
        </div>

        <PointList
          points={DOCTOR_POINTS}
          className="space-y-5 border-t border-slate-200 pt-6 dark:border-slate-700 md:border-t-0 md:pt-0 lg:space-y-7 lg:border-l lg:pl-10"
        />
      </Container>
    </Section>
  );
}
