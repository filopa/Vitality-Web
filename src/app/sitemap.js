import { SITE } from "@/lib/site";

// Public pages only. Add /terms, /privacy, ... as they go live.
const PAGES = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/signup", priority: 0.7, changeFrequency: "monthly" },
  { path: "/signup/doctor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "yearly" },
];

export default function sitemap() {
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE.url}${path}`,
    changeFrequency,
    priority,
  }));
}
