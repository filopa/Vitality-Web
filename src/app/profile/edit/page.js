import Link from "next/link";
import { EditProfileForm } from "../../_components/profile/EditProfileForm";
import ThemeToggle from "../../theme-toggle";

export const metadata = {
  title: { absolute: "Edit Profile | Vitality" },
  robots: { index: false, follow: false },
};

export default function EditProfilePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-background px-5 pb-6 pt-[120px] font-brand text-foreground md:px-8 md:pb-12 lg:justify-center lg:pt-12">
      <div className="absolute right-5 top-5 z-10 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-[448px] flex-col gap-4">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[32px] font-bold leading-10 tracking-[-0.02em] md:text-4xl md:leading-[44px]">
            Edit Profile
          </h1>
          <p className="text-base leading-6 text-muted">Update your photo and personal details.</p>
        </header>

        <section className="rounded-[20px] bg-surface px-6 pb-6 pt-10 text-surface-foreground shadow-[0_8px_12px_rgba(15,23,42,0.08)] md:px-10 md:pb-10 md:pt-12">
          <EditProfileForm />
        </section>

        <Link href="/home" className="pb-4 text-center text-sm text-muted hover:text-foreground hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
