import { SITE } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / app-only routes
        disallow: ["/api/", "/home", "/onboarding","/complete-profile"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
