import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/landing-data";
import { SITE, SOCIALS } from "@/lib/site";
import { I } from "./ui/Icon";
import { Container } from "./ui/primitives";

export default function Footer() {
  const socials = SOCIALS.filter((s) => s.href);

  return (
    <footer id="faq" className="scroll-mt-16 bg-[#0b2a4a] text-white">
      <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between lg:py-10">
        <div>
          <Link href="#home" className="flex items-center gap-2">
        <img className="w-16 h-16" src="https://f003.backblazeb2.com/file/Video-Dolphin/android-icon-foreground.png" alt="Vitality" />
          <span className="text-2xl font-bold tracking-tight">{SITE.name}</span>
          </Link>
          <p className="mt-2 text-sm text-white/80">{SITE.tagline}</p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs text-white/80 sm:flex sm:flex-wrap sm:gap-x-8"
        >
          {FOOTER_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-start gap-3 md:items-end">
          {socials.length > 0 && (
            <ul className="flex gap-5 text-white/90">
              {socials.map(({ label, short, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SITE.name} on ${label}`}
                    className="text-sm font-semibold hover:text-[#3cc3dd]"
                  >
                    {short}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-white/60">
            © 2026 {SITE.name}. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
