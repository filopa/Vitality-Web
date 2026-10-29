import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "../theme-toggle";
import { RegisterForm } from "./Registerform";

export const metadata = {
  title: "Create Your Account",
};

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center  overflow-hidden bg-background px-5 pb-6 pt-[120px] font-brand text-foreground md:px-8 md:pb-12 lg:justify-center lg:pt-12">
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8 ">
        <ThemeToggle />
      </div>

      {/* Decorative background glow (top-right) */}
  

      <div className="relative flex w-full max-w-[448px] flex-col gap-4">
        {/* Hero */}
        <header className="flex flex-col items-center gap-2 text-center">
          <div className="relative size-[72px]">
            <div className="absolute inset-[-22.22%_-27.78%_-33.33%_-27.78%]">
              <Image
                src="https://f003.backblazeb2.com/file/Video-Dolphin/android-icon-foreground.png" alt="Vitality"
                fill
                sizes="112px"
                className="max-w-none"
                priority
              />
            </div>
          </div>
          <h1 className="pt-2 text-[32px] font-bold leading-10 tracking-[-0.02em] md:text-4xl md:leading-[44px]">
            Create Your Account
          </h1>
          <p className="text-base leading-6 text-muted">
            Connect privately with verified healthcare professionals.
          </p>
        </header>

        {/* Card */}
        <section className="rounded-[20px] bg-surface px-6 pb-6 pt-10 text-surface-foreground shadow-[0_8px_12px_rgba(15,23,42,0.08)] md:px-10 md:pb-10 md:pt-12">
          <RegisterForm />
        </section>

        {/* Privacy note */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-accent px-[17px] py-[11px]">
          <Image
            src="/images/register/shield-icon.svg"
            width={10.67}
            height={13.33}
            alt=""
            aria-hidden
          />
          <p className="text-sm leading-5 text-muted">
            Your information stays private and secure.
          </p>
        </div>

        <p className="pb-8 pt-2 text-center text-base leading-6 text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
