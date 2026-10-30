import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/legal-content";
import { pageMetadata } from "@/lib/seo";
import LegalPage from "../_components/legal/LegalPage";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Vitality collects, uses, and protects your personal information, and the choices you have.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />;
}
