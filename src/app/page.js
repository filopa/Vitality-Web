"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import Logo from "./Componnet/Logo";
import ConnectedCommunity from "./Componnet/Connectedcommunity";

/* ------------------------------------------------------------------ */
/*  Images                                                             */
/*  Remote hosts must be allowed in next.config.js (see notes).        */
/* ------------------------------------------------------------------ */
const IMG = {
  hero: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_gyotibgyotibgyot.jpg",
  doctor:
    "https://f003.backblazeb2.com/file/Video-Dolphin/Smiling+Doctor+in+Modern+Clinic.png",
  patient:
    "https://f003.backblazeb2.com/file/Video-Dolphin/Remote+Work+in+a+Sunlit+Living+Room.png",
  stethoscope: "/images/stethoscope.jpg",
  // doctorsNetwork: "/images/doctors-network.png", // currently unused
};

/* ------------------------------------------------------------------ */
/*  Layout system                                                      */
/*  ONE container width + ONE horizontal padding for every section.    */
/*  ONE vertical rhythm for every section.                             */
/* ------------------------------------------------------------------ */
const SECTION_Y = "py-10 sm:py-12 lg:py-16";

const Container = ({ className = "", children }) => (
  <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

// scroll-mt-16 = height of the sticky navbar, so anchors don't hide under it
function Section({ id, className = "", children }) {
  return (
    <section id={id} className={`scroll-mt-16 ${className}`}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny inline icon set (no extra dependency)                         */
/* ------------------------------------------------------------------ */
function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  logo: (c) => (
    <Icon className={c}>
      <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11Z" />
      <path d="M7 12h3l1.5-3 2 6 1.5-3H17" />
    </Icon>
  ),
  moon: (c) => (
    <svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth={1.8}
  strokeLinecap="round"
  strokeLinejoin="round"
  className="h-5 w-5"
>
  <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
</svg>
  ),
  sun: (c) => (
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth={1.8}
  strokeLinecap="round"
  strokeLinejoin="round"
  className="h-5 w-5"
>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v2" />
  <path d="M12 20v2" />
  <path d="m4.93 4.93 1.42 1.42" />
  <path d="m17.65 17.65 1.42 1.42" />
  <path d="M2 12h2" />
  <path d="M20 12h2" />
  <path d="m6.35 17.65-1.42 1.42" />
  <path d="m19.07 4.93-1.42 1.42" />
</svg>
  ),
  arrow: (c) => (
    <Icon className={c}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  ),
  menu: (c) => (
    <Icon className={c}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  ),
  close: (c) => (
    <Icon className={c}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  ),
  chat: (c) => (
    <Icon className={c}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      <path d="M9 11h6M9 14h4" />
    </Icon>
  ),
  users: (c) => (
    <Icon className={c}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.8.8 3 2.6 3 4.7" />
    </Icon>
  ),
  shield: (c) => (
    <Icon className={c}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  ),
  user: (c) => (
    <Icon className={c}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </Icon>
  ),
  network: (c) => (
    <Icon className={c}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="8" r="2.5" />
      <circle cx="9" cy="18" r="2.5" />
      <path d="m8 7 8 1M7 8.5l2 7M17 10.5l-6 6" />
    </Icon>
  ),
  stetho: (c) => (
    <Icon className={c}>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v2a4 4 0 0 0 8 0v-1" />
      <circle cx="18" cy="12" r="2" />
    </Icon>
  ),
  book: (c) => (
    <Icon className={c}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" />
      <path d="M8 8h7M8 12h5" />
    </Icon>
  ),
  heart: (c) => (
    <Icon className={c}>
      <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" />
    </Icon>
  ),
  lock: (c) => (
    <Icon className={c}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icon>
  ),
  home: (c) => (
    <Icon className={c}>
      <path d="m4 11 8-7 8 7v9H4z" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  ),
  pen: (c) => (
    <Icon className={c}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    </Icon>
  ),
  code: (c) => (
    <Icon className={c}>
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />
    </Icon>
  ),
  group: (c) => (
    <Icon className={c}>
      <circle cx="12" cy="7" r="2.5" />
      <circle cx="6" cy="16" r="2.5" />
      <circle cx="18" cy="16" r="2.5" />
      <path d="M12 10v3M9 14l-1 .2M15 14l1 .2" />
    </Icon>
  ),
  check: (c) => (
    <Icon className={c}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="M9 12h6M9 15h4" />
    </Icon>
  ),
};

const I = ({ name, className }) => icons[name](className);

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                      */
/* ------------------------------------------------------------------ */
function Button({ children, variant = "solid", href = "#", className = "" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b9ab8]";
  const styles =
    variant === "solid"
      ? "bg-[#0b9ab8] text-white shadow-sm hover:bg-[#08859f]"
      : "border border-[#0b9ab8] bg-white/60 text-[#0b9ab8] hover:bg-[#0b9ab8]/10 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-800";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
      <I name="arrow" className="h-4 w-4" />
    </a>
  );
}

function IconBubble({ name }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300 sm:h-11 sm:w-11">
      <I name={name} className="h-5 w-5" />
    </span>
  );
}

function Point({ icon, title, text }) {
  return (
    <li className="flex items-start gap-3 sm:gap-4">
      <IconBubble name={icon} />
      <div>
        <h3 className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100">{title}</h3>
        <p className="mt-0.5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400 lg:text-xs">
          {text}
        </p>
      </div>
    </li>
  );
}

/**
 * Optimised image.
 * - The wrapper owns the size (aspect ratio / height) so nothing shifts
 *   while the image loads; the gradient is the placeholder.
 * - Lazy by default, `priority` only for the above-the-fold hero.
 * - `sizes` tells Next which width to serve per breakpoint.
 */
function Photo({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  imgClassName = "",
}) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#e3f4f8] to-[#c8e9f1] dark:from-slate-800 dark:to-slate-900 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={75}
        className={`object-cover ${imgClassName}`}
      />
    </div>
  );
}

const Heading = ({ children, className = "" }) => (
  <h2
    className={`text-2xl font-bold leading-tight tracking-tight text-[#0b2a4a] dark:text-slate-100 sm:text-3xl lg:text-4xl ${className}`}
  >
    {children}
  </h2>
);

/* ------------------------------------------------------------------ */
/*  Navbar (now has a mobile menu — before, nav was invisible < lg)    */
/* ------------------------------------------------------------------ */
// Set to true when the Team section is re-enabled below.
const HAS_TEAM_SECTION = false;

const navLinks = [
  ["Home", "#home"],
  ["For Doctors", "#doctors"],
  ["For Patients", "#patients"],
  ["Our Team", "#team"],
  ["About Us", "#about"],
  ["FAQ", "#faq"],
].filter(([, href]) => HAS_TEAM_SECTION || href !== "#team");

function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const savedTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo href="#home" />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-xs font-medium text-[#0b2a4a] dark:text-slate-200 lg:flex"
        >
          {navLinks.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-[#0b9ab8]">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            title={theme === "light" ? "Dark mode" : "Light mode"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#0b2a4a] transition hover:bg-[#e3f4f8] dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            <I
              name={theme === "light" ? "moon" : "sun"}
              className="h-5 w-5"
            />
          </button>

          <a
            href="#waitlist"
            className="rounded-full bg-[#0b9ab8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#08859f]"
          >
            Sign In
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#0b2a4a] hover:bg-[#e3f4f8] dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            <I name={open ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </Container>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-slate-100 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <Container className="grid grid-cols-2 gap-x-4 py-3 sm:grid-cols-3">
            {navLinks.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-[#0b2a4a] hover:text-[#0b9ab8] dark:text-slate-200"
              >
                {label}
              </a>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/*  Mobile  (<sm): text only — image hidden                            */
/*  Tablet  (sm–lg): image as a wide banner under the text             */
/*  Desktop (lg+): image bleeds to the right edge (intentional),       */
/*                 text still starts on the shared container edge      */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <Section
      id="home"
      className="relative isolate overflow-hidden bg-gradient-to-r from-[#eef8fb] via-white to-[#e6f5f9] dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950"
    >
      <Container className={`${SECTION_Y} lg:py-24`}>
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-medium text-[#0b2a4a]/80 dark:text-slate-300">
            A Better Healthcare Community
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0b2a4a] dark:text-slate-100 sm:text-6xl lg:text-7xl">
            Healthcare,
            <br />
            <span className="text-[#0b9ab8]">Connected.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Vitality is a platform that brings doctors and patients closer
            together — building a more connected, trusted, and supportive
            healthcare community.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#doctors"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b9ab8] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0b9ab8]/25 transition hover:bg-[#0a89a5]"
            >
              Join as a Doctor
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="#patients"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0b9ab8] bg-white/70 px-7 py-3 text-sm font-semibold text-[#0b9ab8] backdrop-blur transition hover:bg-[#0b9ab8]/10 dark:bg-slate-900/80 dark:text-cyan-300 dark:hover:bg-slate-800"
            >
              Join as a Patient
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* ONE image element, repositioned per breakpoint (no duplicate download) */}
        <Photo
          src={IMG.hero}
          alt="Vitality on laptop and phone"
          priority
          sizes="(min-width: 1024px) 62vw, (min-width: 640px) 90vw, 0px"
          className="mt-8 hidden aspect-[16/8] rounded-3xl sm:block lg:absolute lg:inset-y-0 lg:right-0 lg:-z-20 lg:mt-0 lg:aspect-auto lg:w-[62%] lg:rounded-none"
          imgClassName="object-left"
        />
      </Container>

      {/* Fades the image into the page on desktop only */}
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

/* ------------------------------------------------------------------ */
/*  Vision                                                             */
/*  Mobile: text + points                                              */
/*  Tablet: text | visual, then points in a 3-col row                  */
/*  Desktop: 3 columns                                                 */
/* ------------------------------------------------------------------ */
function Vision() {
  return (
    <Section className={`bg-[#f4fbfd] dark:bg-slate-900 ${SECTION_Y}`}>
      <Container className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr] lg:gap-10">
        <div>
          <Heading>
            Healthcare Should
            <br className="hidden sm:block" /> Feel More{" "}
            <span className="text-[#0b9ab8]">Connected.</span>
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Health is not just about treatment — it&apos;s about people, trust,
            and meaningful connections. Vitality aims to create a digital space
            where doctors and patients can interact, share knowledge, and
            support each other on their healthcare journeys.
          </p>
        </div>

        {/* Decorative visual: hidden on mobile */}
        <div className="mx-auto hidden aspect-square w-full max-w-xs overflow-hidden md:block lg:max-w-sm">
          <ConnectedCommunity />
        </div>

        <ul className="grid gap-5 md:col-span-2 md:grid-cols-3 lg:col-span-1 lg:grid-cols-1 lg:gap-7">
          <Point
            icon="chat"
            title="Better Communication"
            text="Bridging the gap between doctors and patients."
          />
          <Point
            icon="users"
            title="Stronger Community"
            text="Support, learn and grow together."
          />
          <Point
            icon="shield"
            title="Improved Access"
            text="Healthcare, when and where you need it."
          />
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Doctors                                                            */
/*  Mobile: text + points (photo hidden)                               */
/*  Tablet: photo | text over points                                   */
/*  Desktop: photo | text | points                                     */
/* ------------------------------------------------------------------ */
function Doctors() {
  return (
    <Section
      id="doctors"
      className={`bg-gradient-to-r from-white via-[#f7fcfd] to-[#eef8fb] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${SECTION_Y}`}
    >
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-x-10 lg:grid-cols-[0.9fr_1fr_1fr] lg:gap-x-12">
        <Photo
          src={IMG.doctor}
          alt="Smiling doctor"
          sizes="(min-width: 1024px) 30vw, 45vw"
          className="hidden min-h-[280px] rounded-3xl md:row-span-2 md:block md:h-full lg:row-span-1 lg:min-h-[340px]"
        />

        <div>
          <Heading>
            A Space for
            <br className="hidden sm:block" /> Healthcare Professionals.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Build your professional profile, connect with colleagues, share
            knowledge, and be part of a supportive medical community.
          </p>
          <div className="mt-6">
            <Button>Join as a Doctor</Button>
          </div>
        </div>

        <ul className="space-y-5 border-t border-slate-200 pt-6 dark:border-slate-700 md:border-t-0 md:pt-0 lg:space-y-7 lg:border-l lg:pl-10">
          <Point
            icon="user"
            title="Professional Profile"
            text="Showcase your expertise and experience."
          />
          <Point
            icon="network"
            title="Network & Collaborate"
            text="Connect with colleagues and share knowledge."
          />
          <Point
            icon="chat"
            title="Community"
            text="Join discussions and stay updated."
          />
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Patients (mirror of Doctors)                                       */
/*  Mobile: text + points (photo hidden)                               */
/*  Tablet: text over points | photo                                   */
/*  Desktop: text | points | photo                                     */
/* ------------------------------------------------------------------ */
function Patients() {
  return (
    <Section
      id="patients"
      className={`bg-gradient-to-r from-white via-[#f4fbfd] to-[#eef8fb] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${SECTION_Y}`}
    >
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-x-10 lg:grid-cols-[1fr_1fr_0.9fr] lg:gap-x-12">
        <div className="md:col-start-1 md:row-start-1">
          <Heading>
            Your Healthcare Journey,
            <br className="hidden sm:block" /> More Connected.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Find trusted doctors, get reliable health information, and be part
            of a community that cares about your wellbeing.
          </p>
          <div className="mt-6">
            <Button>Join as a Patient</Button>
          </div>
        </div>

        <ul className="space-y-5 border-t border-slate-200 pt-6 dark:border-slate-700 md:col-start-1 md:row-start-2 md:border-t-0 md:pt-0 lg:col-start-2 lg:row-start-1 lg:space-y-7 lg:border-l lg:pl-10">
          <Point
            icon="user"
            title="Find Trusted Doctors"
            text="Discover verified doctors and specialists."
          />
          <Point
            icon="stetho"
            title="Access Health Information"
            text="Learn, ask, and make informed decisions."
          />
          <Point
            icon="heart"
            title="Community Support"
            text="Share your story and get support."
          />
        </ul>

        <Photo
          src={IMG.patient}
          alt="Woman using laptop"
          sizes="(min-width: 1024px) 28vw, 45vw"
          className="hidden min-h-[280px] rounded-3xl md:col-start-2 md:row-span-2 md:row-start-1 md:block md:h-full lg:col-start-3 lg:row-span-1 lg:min-h-[340px]"
        />
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: "user",
    title: "Professional Profiles",
    text: "Verified doctor accounts and detailed profiles.",
    status: "Available Now",
  },
  {
    icon: "chat",
    title: "Secure Messaging",
    text: "Connect and communicate in a safe environment.",
    status: "Available Now",
  },
  {
    icon: "home",
    title: "Healthcare Community",
    text: "Join discussions, share experiences, and learn.",
    status: "Coming Soon",
  },
  {
    icon: "pen",
    title: "Account Management",
    text: "Your data, your control.",
    status: "Available Now",
  },
];

function Features() {
  return (
    <Section className={`bg-white dark:bg-slate-950 ${SECTION_Y}`}>
      <Container className="grid gap-8 lg:grid-cols-[1fr_2.4fr] lg:gap-10">
        <div>
          <Heading>
            Built Around Real
            <br className="hidden sm:block" /> Healthcare Needs.
          </Heading>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Vitality combines technology and human connection to deliver a
            simple, secure, and meaningful experience for both doctors and
            patients.
          </p>
          <div className="mt-6">
            <Button href="#features">Explore Features</Button>
          </div>
        </div>

        <div
          id="features"
          className="grid scroll-mt-20 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
        >
          {features.map((f) => (
            <article
              key={f.title}
              className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(11,154,184,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            >
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300 sm:mb-5">
                <I name={f.icon} className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100">{f.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400 lg:text-xs">
                {f.text}
              </p>
              <span
                className={`mt-4 w-fit rounded-full border px-3 py-1 text-[10px] font-medium ${
                  f.status === "Available Now"
                    ? "border-[#0b9ab8]/40 bg-[#e3f4f8] text-[#0b9ab8] dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {f.status}
              </span>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Team (kept, still disabled — re-enable + set HAS_TEAM_SECTION)     */
/* ------------------------------------------------------------------ */
const leads = [
  { icon: "code", title: "Technical Lead", sub: "(Development)" },
  { icon: "stetho", title: "Medical Lead", sub: "(Clinical & Medical)" },
  { icon: "group", title: "Operations Lead", sub: "(Partnerships & Growth)" },
  { icon: "pen", title: "Product & Design Lead", sub: "(UX/UI)" },
];

// function Team() {
//   return (
//     <Section id="team" className={`bg-[#f4fbfd] ${SECTION_Y}`}>
//       <Container className="grid items-center gap-8 lg:grid-cols-[0.8fr_2fr_0.9fr]">
//         ... (same content as before, now inside <Container> and <Section>)
//       </Container>
//     </Section>
//   );
// }

/* ------------------------------------------------------------------ */
/*  Trust + Waitlist                                                   */
/*  Mobile/tablet: no side photo                                       */
/*  Desktop: photo | trust | waitlist, all inside the shared container */
/* ------------------------------------------------------------------ */
function TrustAndWaitlist() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    if (!email) return;
    // TODO: send `email` to your API / mailing list
    setSent(true);
  }
return (
  <Section id="about" className={`bg-white dark:bg-slate-950 ${SECTION_Y}`}>
    <Container className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
      <div className="grid items-center gap-5 md:grid-cols-2 md:gap-8">
        <div>
          <h2 className="text-xl font-bold leading-tight text-[#0b2a4a] dark:text-slate-100 sm:text-2xl">
            Your Health. Our Priority.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We take your privacy and security seriously. Vitality is built
            with the highest standards of data protection and responsible
            healthcare practices.
          </p>
        </div>
        <ul className="space-y-4 rounded-2xl bg-[#f4fbfd] p-4 dark:bg-slate-900 sm:p-5">
          {[
            ["lock", "Data Privacy", "Your information is safe with us."],
            [
              "check",
              "Verified Doctors",
              "A verification process for medical professionals.",
            ],
            [
              "shield",
              "Responsible Content",
              "Trusted and reliable health information.",
            ],
          ].map(([icon, t, d]) => (
            <li key={t} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300">
                <I name={icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100 lg:text-xs">
                  {t}
                </p>
                <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        id="waitlist"
        className="flex scroll-mt-20 flex-col justify-center rounded-2xl bg-[#0b2a4a] p-6 text-white sm:p-8"
      >
        <h2 className="text-xl font-bold leading-tight sm:text-2xl">
          Be Among the First
          <br className="hidden sm:block" /> to Experience Vitality.
        </h2>
        <p className="mt-3 text-sm text-white/70 lg:text-xs">
          Sign up now to get updates about our progress and be notified when
          we launch.
        </p>

        {sent ? (
          <p
            role="status"
            className="mt-5 rounded-lg bg-white/10 px-4 py-3 text-sm"
          >
            You&apos;re on the list. We&apos;ll email you at launch.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row"
          >
        

<Link
  href="/signup"
  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b9ab8] px-5 py-2.5 text-xs font-semibold hover:bg-[#08859f]"
>
  Sign Up <I name="arrow" className="h-3.5 w-3.5" />
</Link>
          </form>
        )}
      </div>
    </Container>
  </Section>
);
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer id="faq" className="scroll-mt-16 bg-[#0b2a4a] text-white">
      <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between lg:py-10">
        <div>
          <a href="#home" className="flex items-center gap-2">
            <I name="logo" className="h-8 w-8 text-[#3cc3dd]" />
            <span className="text-2xl font-bold tracking-tight">Vitality</span>
          </a>
          <p className="mt-2 text-sm text-white/80">Healthcare, Connected.</p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-white/80 sm:flex sm:flex-wrap sm:gap-x-8"
        >
          {["About Us", "Contact", "Privacy Policy", "Terms of Service"].map(
            (l) => (
              <a key={l} href="#" className="hover:text-white">
                {l}
              </a>
            )
          )}
        </nav>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex gap-5 text-white/90">
            {["in", "X", "ig", "yt"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="text-sm font-semibold hover:text-[#3cc3dd]"
              >
                {s}
              </a>
            ))}
          </div>
          <p className="text-[11px] text-white/60">
            © 2026 Vitality. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
export default function Page() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <Hero />
      <Vision />
      <Doctors />
      <Patients />
      <Features />
      {/* <Team /> */}
      <TrustAndWaitlist />
      <Footer />
    </main>
  );
}