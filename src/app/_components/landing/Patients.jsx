import { IMG, PATIENT_POINTS } from "@/lib/landing-data";
import { Button, Container, Heading, Photo, PointList, Section, SECTION_Y } from "./ui/primitives";

export default function Patients() {
  return (
    <Section
      id="patients"
      labelledBy="patients-title"
      className={`bg-gradient-to-r from-white via-[#f4fbfd] to-[#eef8fb] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${SECTION_Y}`}
    >
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-x-10 lg:grid-cols-[1fr_1fr_0.9fr] lg:gap-x-12">
        <div className="md:col-start-1 md:row-start-1">
          <Heading id="patients-title">
            Your Healthcare Journey,
            <br className="hidden sm:block" /> More Connected.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Find trusted doctors, get reliable health information, and be part of a community that cares about your
            wellbeing.
          </p>
          <div className="mt-6">
            <Button href="/signup">Join as a Patient</Button>
          </div>
        </div>

        <PointList
          points={PATIENT_POINTS}
          className="space-y-5 border-t border-slate-200 pt-6 dark:border-slate-700 md:col-start-1 md:row-start-2 md:border-t-0 md:pt-0 lg:col-start-2 lg:row-start-1 lg:space-y-7 lg:border-l lg:pl-10"
        />

        <Photo
          src={IMG.patient}
          alt="Woman using a laptop at home"
          sizes="(min-width: 1024px) 28vw, 45vw"
          className="hidden min-h-[280px] rounded-3xl md:col-start-2 md:row-span-2 md:row-start-1 md:block md:h-full lg:col-start-3 lg:row-span-1 lg:min-h-[340px]"
        />
      </Container>
    </Section>
  );
}
