import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";
import LegalPage from "../_components/legal/LegalPage";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description: "The terms that apply when you use Vitality, the healthcare community connecting doctors and patients.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage title="Terms of Service" intro={TERMS_INTRO} sections={TERMS_SECTIONS} />;
}
