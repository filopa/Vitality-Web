import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import ThemeToggle from "../../theme-toggle";
import { DoctorRegisterForm } from "./DoctorRegisterForm";

export const metadata = {
  title: "Join as a Doctor – Vitality",
};

export default function DoctorRegisterPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-background px-5 pb-6 pt-[120px] font-brand text-foreground md:px-8 md:pb-12 lg:justify-center lg:pt-12">
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-[448px] flex-col gap-4">
        {/* Hero */}
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="relative size-[72px]">
            <div className="absolute inset-[-22.22%_-27.78%_-33.33%_-27.78%]">
              <Image
                src="https://f003.backblazeb2.com/file/Video-Dolphin/android-icon-foreground.png"
                alt="Vitality"
                fill
                sizes="112px"
                className="max-w-none"
                priority
              />
            </div>
          </div>
          <h1 className="pt-2 text-[32px] font-bold leading-10 tracking-[-0.02em] md:text-4xl md:leading-[44px]">
            Join as a Doctor
          </h1>
          <p className="text-base leading-6 text-muted">
            Submit your credentials for professional verification.
          </p>
        </header>

        {/* Pending-review notice */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-accent px-4 py-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
            />
          </svg>
          <p className="text-sm leading-5 text-muted">
            After submitting, your account will be reviewed by our admin team.
            You will be notified once approved.
          </p>
        </div>

        {/* Card */}
        <section className="rounded-[20px] bg-surface px-6 pb-6 pt-10 text-surface-foreground shadow-[0_8px_12px_rgba(15,23,42,0.08)] md:px-10 md:pb-10 md:pt-12">
          <Suspense fallback={<div className="py-8 text-center text-sm text-muted">Loading form...</div>}>
            <DoctorRegisterForm />
          </Suspense>
        </section>

        <p className="pb-8 pt-2 text-center text-base leading-6 text-muted">
          Not a doctor?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create a regular account
          </Link>
        </p>
      </div>
    </main>
  );
}
