import { SITE, buildJsonLd } from "@/lib/site";
import JsonLd from "./_components/seo/JsonLd";
import Doctors from "./_components/landing/Doctors";
import Features from "./_components/landing/Features";
import Footer from "./_components/landing/Footer";
import Hero from "./_components/landing/Hero";
import Navbar from "./_components/landing/Navbar";
import Patients from "./_components/landing/Patients";
import Trust from "./_components/landing/Trust";
import Vision from "./_components/landing/Vision";

const TITLE = `${SITE.name} | Healthcare Community for Doctors & Patients`;

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { absolute: TITLE },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: TITLE,
    description: SITE.description,
    images: [{ url: SITE.ogImage, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE.description,
    images: [SITE.ogImage],
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <JsonLd data={buildJsonLd()} />
      <Navbar />
      <main>
        <Hero />
        <Vision />
        <Doctors />
        <Patients />
        <Features />
        <Trust />
      </main>
      <Footer />
    </div>
  );
}