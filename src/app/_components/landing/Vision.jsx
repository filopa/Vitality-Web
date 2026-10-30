import { VISION_POINTS } from "@/lib/landing-data";
import ConnectedCommunity from "../Connectedcommunity";
import { Container, Heading, PointList, Section, SECTION_Y } from "./ui/primitives";

export default function Vision() {
  return (
    <Section labelledBy="vision-title" className={`bg-[#f4fbfd] dark:bg-slate-900 ${SECTION_Y}`}>
      <Container className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr] lg:gap-10">
        <div>
          <Heading id="vision-title">
            Healthcare Should
            <br className="hidden sm:block" /> Feel More <span className="text-[#0b9ab8]">Connected.</span>
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Health is not just about treatment — it&apos;s about people, trust, and meaningful connections. Vitality
            aims to create a digital space where doctors and patients can interact, share knowledge, and support each
            other on their healthcare journeys.
          </p>
        </div>

        {/* Decorative visual: hidden on mobile */}
        <div className="mx-auto hidden aspect-square w-full max-w-xs overflow-hidden md:block lg:max-w-sm">
          <ConnectedCommunity />
        </div>

        <PointList
          points={VISION_POINTS}
          className="grid gap-5 md:col-span-2 md:grid-cols-3 lg:col-span-1 lg:grid-cols-1 lg:gap-7"
        />
      </Container>
    </Section>
  );
}
