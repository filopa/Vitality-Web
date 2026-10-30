import Image from "next/image";
import Link from "next/link";

export default function PromoBanner() {
  return (
    <section
      aria-labelledby="promo-title"
      className="relative flex min-h-[210px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-accent-foreground to-primary text-primary-foreground shadow-sm md:min-h-[240px]"
    >
      {/* Texture + soft highlight */}
      <Image
        src="/images/dashboard/banner-texture.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 960px, 100vw"
        aria-hidden="true"
        className="object-cover opacity-20 mix-blend-overlay"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,white,transparent_50%)] opacity-20"
      />
      <Image
        src="/images/dashboard/banner-kit.svg"
        alt=""
        width={139}
        height={139}
        aria-hidden="true"
        className="absolute bottom-6 right-3 size-[139px] md:right-10 md:size-[190px]"
      />

      <div className="relative z-10 flex flex-col items-start gap-2 p-6 md:p-10">
        <span className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold leading-4 tracking-[0.05em]">
          Limited Offer
        </span>
        <h2
          id="promo-title"
          className="max-w-[13rem] pt-2 text-2xl font-semibold leading-[30px] tracking-[-0.01em] md:max-w-xs md:text-3xl md:leading-9"
        >
          20% Off Health Check Packages
        </h2>
        <Link
          href="/packages"
          className="mt-2 rounded-full bg-surface px-6 py-2 text-xs font-bold leading-4 tracking-[0.05em] text-primary transition hover:opacity-90"
        >
          Learn More
        </Link>
      </div>
    </section>
  );
}
