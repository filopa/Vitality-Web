export const IMG = {
  hero: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_gyotibgyotibgyot.jpg",
  doctor: "https://f003.backblazeb2.com/file/Video-Dolphin/Smiling+Doctor+in+Modern+Clinic.png",
  patient: "https://f003.backblazeb2.com/file/Video-Dolphin/Remote+Work+in+a+Sunlit+Living+Room.png",
};

export const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "For Doctors", href: "#doctors" },
  { label: "For Patients", href: "#patients" },
  { label: "About Us", href: "/#about" },
  { label: "FAQ", href: "#faq" },
];

export const VISION_POINTS = [
  { icon: "chat", title: "Better Communication", text: "Bridging the gap between doctors and patients." },
  { icon: "users", title: "Stronger Community", text: "Support, learn and grow together." },
  { icon: "shield", title: "Improved Access", text: "Healthcare, when and where you need it." },
];

export const DOCTOR_POINTS = [
  { icon: "user", title: "Professional Profile", text: "Showcase your expertise and experience." },
  { icon: "network", title: "Network & Collaborate", text: "Connect with colleagues and share knowledge." },
  { icon: "chat", title: "Community", text: "Join discussions and stay updated." },
];

export const PATIENT_POINTS = [
  { icon: "user", title: "Find Trusted Doctors", text: "Discover verified doctors and specialists." },
  { icon: "stetho", title: "Access Health Information", text: "Learn, ask, and make informed decisions." },
  { icon: "heart", title: "Community Support", text: "Share your story and get support." },
];

export const FEATURE_STATUS = { available: "Available Now", soon: "Coming Soon" };

export const FEATURES = [
  { icon: "user", title: "Professional Profiles", text: "Verified doctor accounts and detailed profiles.", status: FEATURE_STATUS.available },
  { icon: "chat", title: "Secure Messaging", text: "Connect and communicate in a safe environment.", status: FEATURE_STATUS.available },
  { icon: "home", title: "Healthcare Community", text: "Join discussions, share experiences, and learn.", status: FEATURE_STATUS.soon },
  { icon: "pen", title: "Account Management", text: "Your data, your control.", status: FEATURE_STATUS.available },
];

export const TRUST_POINTS = [
  { icon: "lock", title: "Data Privacy", text: "Your information is safe with us." },
  { icon: "check", title: "Verified Doctors", text: "A verification process for medical professionals." },
  { icon: "shield", title: "Responsible Content", text: "Trusted and reliable health information." },
];

// "Contact" was a dead "#" link, so it was removed. Add it back once you have a real page/email.
export const FOOTER_LINKS = [
  { label: "About Us", href: "/#about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];
