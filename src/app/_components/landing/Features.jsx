import { FEATURES, FEATURE_STATUS } from "@/lib/landing-data";
import { I } from "./ui/Icon";
import { Button, Container, Heading, Section, SECTION_Y } from "./ui/primitives";

const BADGE_AVAILABLE =
  "border-[#0b9ab8]/40 bg-[#e3f4f8] text-[#0b9ab8] dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-300";
const BADGE_SOON =
  "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";

function FeatureCard({ icon, title, text, status }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(11,154,184,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300 sm:mb-5">
        <I name={icon} />
      </span>
      <h3 className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400 lg:text-xs">{text}</p>
      <span
        className={`mt-4 w-fit rounded-full border px-3 py-1 text-[10px] font-medium ${
          status === FEATURE_STATUS.available ? BADGE_AVAILABLE : BADGE_SOON
        }`}
      >
        {status}
      </span>
    </article>
  );
}

export default function Features() {
  return (
    <Section id="features" labelledBy="features-title" className={`bg-white dark:bg-slate-950 ${SECTION_Y}`}>
      <Container className="grid gap-8 lg:grid-cols-[1fr_2.4fr] lg:gap-10">
        <div>
          <Heading id="features-title">
            Built Around Real
            <br className="hidden sm:block" /> Healthcare Needs.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Vitality combines technology and human connection to deliver a simple, secure, and meaningful experience
            for both doctors and patients.
          </p>
          <div className="mt-6">
            <Button href="/signup">Get Started</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
