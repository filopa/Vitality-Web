import Link from "next/link";
import { LEGAL } from "@/lib/site";
import Logo from "../Logo";
import Footer from "../landing/Footer";
import { Container } from "../landing/ui/primitives";

const TEXT = "text-sm leading-relaxed text-slate-600 dark:text-slate-300";

function Block({ block }) {
  if (typeof block === "string") return <p className={`mt-3 ${TEXT}`}>{block}</p>;

  return (
    <ul className={`mt-3 list-disc space-y-1.5 ps-5 ${TEXT}`}>
      {block.list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalPage({ title, intro, sections }) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-100 dark:border-slate-800">
        <Container className="flex h-16 items-center justify-between">
          <Logo href="/" />
          <Link href="/" className="text-xs font-medium text-[#0b2a4a] hover:text-[#0b9ab8] dark:text-slate-200">
            ← Back to home
          </Link>
        </Container>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0b2a4a] dark:text-slate-100 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: {LEGAL.lastUpdated}</p>
        <p className={`mt-5 ${TEXT}`}>{intro}</p>

        <nav aria-label="Table of contents" className="mt-8 rounded-2xl bg-[#f4fbfd] p-5 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contents</p>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[#0b2a4a] hover:text-[#0b9ab8] dark:text-slate-200">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-10 scroll-mt-8">
            <h2 id={`${s.id}-title`} className="text-xl font-bold text-[#0b2a4a] dark:text-slate-100">
              {i + 1}. {s.title}
            </h2>
            {s.content.map((block, j) => (
              <Block key={j} block={block} />
            ))}
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
