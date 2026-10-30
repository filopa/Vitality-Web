import { IMG } from "@/lib/landing-data";
import { Button, Container, Photo, Section, SECTION_Y } from "./ui/primitives";

export default function Hero() {
  return (
    <Section
      id="home"
      labelledBy="hero-title"
      className="relative isolate overflow-hidden bg-gradient-to-r from-[#eef8fb] via-white to-[#e6f5f9] dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950"
    >
      <Container className={`${SECTION_Y} lg:py-24`}>
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-medium text-[#0b2a4a]/80 dark:text-slate-300">
            A Better Healthcare Community
          </p>

          <h1
            id="hero-title"
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b2a4a] dark:text-slate-100 sm:text-6xl lg:text-7xl"
          >
            Healthcare,
            <br />
            <span className="text-[#0b9ab8]">Connected.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Vitality is a platform that brings doctors and patients closer together — building a more connected,
            trusted, and supportive healthcare community.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="#doctors" size="lg">
              Join as a Doctor
            </Button>
            <Button href="#patients" size="lg" variant="outline">
              Join as a Patient
            </Button>
          </div>
        </div>

        {/* ONE image element, repositioned per breakpoint (no duplicate download) */}
        <Photo
          src={IMG.hero}
          alt="Vitality healthcare platform shown on a laptop and a phone"
          priority
          sizes="(min-width: 1024px) 62vw, (min-width: 640px) 90vw, 0px"
          className="mt-8 hidden aspect-[16/8] rounded-3xl sm:block lg:absolute lg:inset-y-0 lg:right-0 lg:-z-20 lg:mt-0 lg:aspect-auto lg:w-[62%] lg:rounded-none"
          imgClassName="object-left"
        />
      </Container>

      {/* Fade the image into the page (desktop only) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#eef8fb] from-35% via-[#eef8fb]/80 via-50% to-transparent to-75% dark:from-slate-950 dark:via-slate-950/80 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-gradient-to-b from-white/30 via-transparent to-white/20 dark:from-slate-900/30 dark:to-slate-900/30 lg:block"
      />
    </Section>
  );
}
