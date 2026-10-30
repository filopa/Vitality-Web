import { IMG } from "./landing-data";

export const SITE = {
  name: "Vitality",
  tagline: "Healthcare, Connected.",
  // Set NEXT_PUBLIC_SITE_URL in .env.production, e.g. https://vitality.com
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Vitality is a healthcare community that connects doctors and patients with verified profiles, secure messaging, and trusted health information.",
  logo: "https://f003.backblazeb2.com/file/Video-Dolphin/android-icon-foreground.png",
  // Better: a dedicated 1200x630 image in /public (e.g. "/og.png")
  ogImage: IMG.hero,
};

// Only entries with a real `href` are rendered in the footer and added to the schema.
export const SOCIALS = [
  { label: "LinkedIn", short: "in", href: "" },
  { label: "X", short: "X", href: "" },
  { label: "Instagram", short: "ig", href: "" },
  { label: "YouTube", short: "yt", href: "" },
];

export function buildJsonLd() {
  const sameAs = SOCIALS.filter((s) => s.href).map((s) => s.href);
  const orgId = `${SITE.url}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE.name,
        url: SITE.url,
        logo: SITE.logo,
        description: SITE.description,
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en",
        publisher: { "@id": orgId },
      },
    ],
  };
}

// Fill these in before launch. They are rendered on the Terms and Privacy pages.
export const LEGAL = {
  companyName: "Dolphin Models",
  contactEmail: "Dolphinmodels.agency@gmail.com",
  governingLaw: "Egypt",
  lastUpdated: "October 30, 2026",
};
