import Image from "next/image";
import Link from "next/link";
import { I } from "./Icon";

/* One container width, one horizontal padding, one vertical rhythm for every section */
export const SECTION_Y = "py-10 sm:py-12 lg:py-16";

export function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

// scroll-mt-16 = sticky navbar height, so anchors don't hide under it
export function Section({ id, labelledBy, className = "", children }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`scroll-mt-16 ${className}`}>
      {children}
    </section>
  );
}

export function Heading({ id, className = "", children }) {
  return (
    <h2
      id={id}
      className={`text-2xl font-bold leading-tight tracking-tight text-[#0b2a4a] dark:text-slate-100 sm:text-3xl lg:text-4xl ${className}`}
    >
      {children}
    </h2>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b9ab8]";
const BUTTON_VARIANTS = {
  solid: "bg-[#0b9ab8] text-white shadow-sm hover:bg-[#08859f]",
  outline:
    "border border-[#0b9ab8] bg-white/60 text-[#0b9ab8] backdrop-blur hover:bg-[#0b9ab8]/10 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-800",
};
const BUTTON_SIZES = { md: "px-6 py-2.5", lg: "px-7 py-3" };

export function Button({ children, href, variant = "solid", size = "md", className = "" }) {
  return (
    <Link href={href} className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}>
      {children}
      <I name="arrow" className="h-4 w-4" />
    </Link>
  );
}

export function IconBubble({ name }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f4f8] text-[#0b9ab8] dark:bg-cyan-950 dark:text-cyan-300 sm:h-11 sm:w-11">
      <I name={name} className="h-5 w-5" />
    </span>
  );
}

export function Point({ icon, title, text }) {
  return (
    <li className="flex items-start gap-3 sm:gap-4">
      <IconBubble name={icon} />
      <div>
        <h3 className="text-sm font-semibold text-[#0b2a4a] dark:text-slate-100">{title}</h3>
        <p className="mt-0.5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400 lg:text-xs">{text}</p>
      </div>
    </li>
  );
}

export function PointList({ points, className = "" }) {
  return (
    <ul className={className}>
      {points.map((p) => (
        <Point key={p.title} {...p} />
      ))}
    </ul>
  );
}

export function Photo({ src, alt, sizes, priority = false, className = "", imgClassName = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#e3f4f8] to-[#c8e9f1] dark:from-slate-800 dark:to-slate-900 ${className}`}
    >
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
    </div>
  );
}
