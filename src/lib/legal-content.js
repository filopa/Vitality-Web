import { LEGAL, SITE } from "./site";

/* Each section: { id, title, content: [ "paragraph" | { list: [...] } ] } */

export const TERMS_INTRO = `Welcome to ${SITE.name}. These Terms of Service ("Terms") govern your access to and use of the ${SITE.name} website and services (the "Service"), operated by ${LEGAL.companyName} ("we", "us", "our"). By creating an account or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.`;

export const TERMS_SECTIONS = [
  {
    id: "about",
    title: "About the Service",
    content: [
      `${SITE.name} is a healthcare community platform that lets doctors and patients create profiles, communicate, share information, and take part in discussions. Some features may be labeled "Coming Soon" and may change or be unavailable.`,
    ],
  },
  {
    id: "medical-disclaimer",
    title: "No Medical Advice",
    content: [
      `${SITE.name} is a community and communication platform. It does not provide medical advice, diagnosis, or treatment. Content on the Service, including posts and messages from doctors, is for general information only and is not a substitute for advice from a qualified healthcare provider who knows your situation.`,
      "Never ignore or delay professional medical advice because of something you read on the Service. In an emergency, contact your local emergency services immediately. Do not use the Service or its messaging for emergencies.",
    ],
  },
  {
    id: "accounts",
    title: "Eligibility and Accounts",
    content: [
      "You must be at least 18 years old to create an account. You agree to:",
      {
        list: [
          "provide accurate and current information when you register;",
          "keep your login credentials secure and not share your account;",
          "tell us promptly if you suspect unauthorized access to your account.",
        ],
      },
      "You can sign up with an email and password or with your Google account. You are responsible for all activity under your account.",
    ],
  },
  {
    id: "doctors",
    title: "Doctor Accounts and Verification",
    content: [
      "Doctors may apply for a verified profile. Verification is a review of the information and documents submitted at the time of review. It is not an endorsement, and we do not guarantee any doctor's qualifications, quality of care, or availability.",
      "Doctors are solely responsible for complying with the laws, licensing requirements, and professional and ethical rules that apply to them, including rules on advertising, patient confidentiality, and remote consultations.",
      "Interactions on the Service do not by themselves create a doctor–patient relationship.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: [
      "You agree not to:",
      {
        list: [
          "impersonate another person, or falsely claim to be a healthcare professional;",
          "post content that is unlawful, harassing, hateful, misleading, or that violates someone's privacy;",
          "share another person's health information without their permission;",
          "promote medicines, treatments, or products in a misleading or unsafe way;",
          "attempt to access accounts or data that are not yours, or disrupt or reverse-engineer the Service;",
          "use bots, scrapers, or automated tools without our written permission.",
        ],
      },
    ],
  },
  {
    id: "user-content",
    title: "Your Content",
    content: [
      "You keep ownership of the content you post, including posts, comments, and messages. You give us a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute that content as needed to operate and improve the Service.",
      "You are responsible for what you share. Please avoid posting sensitive health details in public areas. We may remove content or restrict accounts that violate these Terms or that we reasonably believe are harmful.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    content: [
      "Our Privacy Policy explains how we collect and use personal information. By using the Service, you acknowledge that you have read it.",
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property",
    content: [
      `The Service, including its design, software, logo, and the name ${SITE.name}, belongs to ${LEGAL.companyName} or its licensors and is protected by intellectual property laws. These Terms do not give you any right to use our trademarks or branding.`,
    ],
  },
  {
    id: "third-parties",
    title: "Third-Party Services",
    content: [
      "The Service relies on third-party providers, such as Google for sign-in and authentication. Your use of those services is also subject to their own terms and policies. We are not responsible for third-party services.",
    ],
  },
  {
    id: "termination",
    title: "Suspension and Termination",
    content: [
      "You can stop using the Service and request deletion of your account at any time. We may suspend or terminate your access if you violate these Terms, put others at risk, or if we are required to by law.",
    ],
  },
  {
    id: "warranties",
    title: "Disclaimer of Warranties",
    content: [
      `The Service is provided "as is" and "as available", without warranties of any kind, to the fullest extent permitted by law. We do not guarantee that the Service will be uninterrupted or error-free, or that information shared by users is accurate or complete.`,
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: [
      `To the fullest extent permitted by law, ${LEGAL.companyName} will not be liable for indirect, incidental, special, or consequential damages, or for any loss arising from reliance on content shared by users, or from interactions between users. Nothing in these Terms limits liability that cannot be limited by law.`,
    ],
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: [
      'We may update these Terms from time to time. When we make important changes, we will notify you on the Service or by email and update the "Last updated" date. Continuing to use the Service after a change means you accept the new Terms.',
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: [
      `These Terms are governed by the laws of ${LEGAL.governingLaw}, and the courts of that jurisdiction will have jurisdiction over any dispute, unless the law of your place of residence requires otherwise.`,
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [`Questions about these Terms? Contact us at ${LEGAL.contactEmail}.`],
  },
];

export const PRIVACY_INTRO = `${LEGAL.companyName} ("we", "us", "our") operates ${SITE.name}. This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and the choices you have. By using the Service, you agree to the practices described here.`;

export const PRIVACY_SECTIONS = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      "Information you provide:",
      {
        list: [
          "account details: name, username, email address, phone number, country, gender, and date of birth;",
          "your password (we do not store passwords in plain text);",
          "if you join as a doctor: professional information needed for verification;",
          "content you create: profile details, posts, comments, and messages;",
          "messages you send to us for support.",
        ],
      },
      "If you sign in with Google, we receive your name, email address, profile photo, and a unique Google account identifier.",
      "Information collected automatically: basic technical data such as device and browser type and usage activity, plus the data stored in your browser described in the Cookies section below.",
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: [
      {
        list: [
          "to create and manage your account and authenticate you;",
          "to provide features such as profiles, messaging, and community discussions;",
          "to verify doctor accounts;",
          "to keep the Service safe, prevent abuse and fraud, and enforce our Terms;",
          "to send service messages, such as security and account notices;",
          "to understand how the Service is used and improve it;",
          "to comply with legal obligations.",
        ],
      },
    ],
  },
  {
    id: "health-information",
    title: "Health Information",
    content: [
      "Health-related details are sensitive. You choose what health information to share in your profile, posts, and messages. Please avoid sharing health details in public areas of the Service. We only use health information you share to provide the features you use, and we do not use it for advertising.",
    ],
  },
  {
    id: "sharing",
    title: "How We Share Information",
    content: [
      "We do not sell your personal information. We share it only in these cases:",
      {
        list: [
          "with other users, according to what you choose to make visible (for example, your public profile and posts);",
          "with service providers that help us run the Service, such as authentication, hosting, and data storage providers (including Google Firebase), under obligations to protect your data;",
          "when required by law, or to protect the rights, safety, and security of users or the Service;",
          "in connection with a merger, acquisition, or sale of assets, with notice to you where required.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies and Local Storage",
    content: [
      "We use a small amount of browser storage to keep the Service working:",
      {
        list: [
          "a session token stored in a cookie and in local storage to keep you signed in;",
          "your theme preference (light or dark) in local storage.",
        ],
      },
      "You can clear this data in your browser settings, but you may be signed out and some features may stop working.",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    content: [
      "We keep your information while your account is active and as long as needed to provide the Service. When you delete your account, we delete or anonymize your personal information within a reasonable period, except where we must keep it to meet legal obligations, resolve disputes, or enforce our agreements.",
    ],
  },
  {
    id: "security",
    title: "Security",
    content: [
      "We use reasonable technical and organizational measures to protect your information. No system is completely secure, so we cannot guarantee absolute security. Please use a strong, unique password and keep it private.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    content: [
      "Depending on where you live, you may have the right to:",
      {
        list: [
          "access the personal information we hold about you;",
          "correct inaccurate information;",
          "delete your account and personal information;",
          "withdraw your consent, where we rely on it;",
          "object to or restrict certain processing.",
        ],
      },
      `To exercise these rights, contact us at ${LEGAL.contactEmail}. We may need to verify your identity before responding.`,
    ],
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: [
      "The Service is for people aged 18 and over. We do not knowingly collect information from anyone under 18. If you believe a minor has created an account, contact us and we will delete it.",
    ],
  },
  {
    id: "transfers",
    title: "International Data Transfers",
    content: [
      "Our service providers may process data in countries other than yours. Where we transfer personal information across borders, we take steps to protect it as required by applicable law.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: [
      'We may update this policy from time to time. When we make important changes, we will notify you on the Service or by email and update the "Last updated" date.',
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [`Questions about privacy? Contact us at ${LEGAL.contactEmail}.`],
  },
];
