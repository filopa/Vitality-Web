import { SITE } from "./site";

/** Metadata for simple public pages (terms, privacy, ...). */
export function pageMetadata({ title, description, path }) {
  const fullTitle = `${title} | ${SITE.name}`;
  return {
    metadataBase: new URL(SITE.url),
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName: SITE.name, title: fullTitle, description },
  };
}
