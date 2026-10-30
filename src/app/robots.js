import { SITE } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / app-only routes
        disallow: ["/api/", "/home", "/home","/complete-profile"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
