import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../../../theme-toggle";

export const metadata = {
  title: "Application Submitted – Vitality",
};

export default function DoctorPendingPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-5 pb-6 pt-12 font-brand text-foreground md:px-8 md:pb-12">
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-[448px] flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-10 w-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-9 tracking-[-0.02em]">
            Application Submitted!
          </h1>
          <p className="text-base leading-6 text-muted">
            Your credentials are under review. Our admin team typically responds
            within <strong>1–2 business days</strong>. You will receive an email
            once your account is approved.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/"
            className="flex h-14 w-full items-center justify-center rounded-full bg-primary font-button text-xl font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Back to home
          </Link>
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center rounded-full border border-border bg-surface font-button text-base font-semibold text-surface-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Go to login
          </Link>
        </div>
      </div>
    </main>
  );
}

