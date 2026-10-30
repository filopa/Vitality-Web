import Link from "next/link";
import { TRUST_POINTS } from "@/lib/landing-data";
import { I } from "./ui/Icon";
import { Container, Section, SECTION_Y } from "./ui/primitives";

export default function Trust() {
  return (
    <Section id="about" labelledBy="trust-title" className={`bg-white dark:bg-slate-950 ${SECTION_Y}`}>
      <Container className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-8">
          <div>
            <h2
              id="trust-title"
              className="text-xl font-bold leading-tight text-[#0b2a4a] dark:text-slate-100 sm:text-2xl"
            >
              Your Health. Our Priority.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              We take your privacy and security seriously. Vitality is built with the highest standards of data
              protection and responsible healthcare practices.
            </p>
          </div>

          <ul className="space-y-4 rounded-2xl bg-[#f4fbfd] p-4 dark:bg-slate-900 sm:p-5">
            {TRUST_POINTS.map(({ icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300">
                  <I name={icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100 lg:text-xs">{title}</p>
                  <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center rounded-2xl bg-[#0b2a4a] p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold leading-tight sm:text-2xl">
            Be Among the First
            <br className="hidden sm:block" /> to Experience Vitality.
          </h2>
          <p className="mt-3 text-sm text-white/70 lg:text-xs">
            Sign up now to get updates about our progress and be notified when we launch.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#0b9ab8] px-5 py-2.5 text-xs font-semibold hover:bg-[#08859f]"
          >
            Sign Up <I name="arrow" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
