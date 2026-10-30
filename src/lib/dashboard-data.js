/* SAMPLE DATA from the Figma design. Replace with real data from your API. */

import {
  ClipboardPlus,
  Home,
  Stethoscope,
  User,
  MessageCircleText,
  Bell,
  Search,
  Star,
  Ambulance,
  ChevronRight,
  HeartHandshake,
  ArrowRight,
  Droplet,
  Pill,
  LayoutGrid,
  HeartPulse,
  TestTube,FileText,
  Brain,
  ScanFace,
} from "lucide-react";

const icon = (name, w, h) => ({ src: `/images/dashboard/${name}.svg`, w, h });

export const ICONS = {
  bell: Bell,
  search: Search,
  star: Star,
  ambulance: Ambulance,
  chevronRight: ChevronRight,
  consult: HeartHandshake,
  arrowRight: ArrowRight,
  hydration: Droplet,
  medication: Pill,
};

export const SPECIALTIES = [
  {
    slug: "general",
    label: "General",
    Icon:LayoutGrid,
  },
  {
    slug: "cardiology",
    label: "Cardiology",
    Icon: HeartPulse,
  },
  { slug: "skin", label: "Skin", Icon: ScanFace  },
  { slug: "brain", label: "Brain", Icon:Brain  },
];

export const SHORTCUTS = [
  {
    label: "Prescriptions",
    href: "/prescriptions",
    Icon: FileText ,
    tint: "bg-primary/10 text-primary",
  },
  {
    label: "Find Labs",
    href: "/labs",
    Icon: TestTube,
    tint: "bg-fuchsia-700/10 text-fuchsia-700",
  },
];

export const DOCTORS = [
  {
    id: "sarah-jenkins",
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiologist",
    rating: 4.9,
    reviews: 120,
    price: 120,
    photo: "/images/dashboard/doctor-sarah.png",
  },
  {
    id: "mark-thompson",
    name: "Dr. Mark Thompson",
    specialty: "Pediatrician",
    rating: 4.8,
    reviews: 85,
    price: 95,
    photo: "/images/dashboard/doctor-mark.png",
  },
];

export const INSIGHTS = [
  {
    id: "hydration",
    Icon: ICONS.hydration,
    accent: "primary",
    title: "Hydration Reminder",
    text: "Time for your 4th glass of water",
  },
  {
    id: "medication",
    Icon: ICONS.medication,
    accent: "success",
    title: "Medication Reminder",
    text: "Vitamin C - 1 Tablet",
    time: "08:00 PM",
  },
];

export const CONSULTATIONS = [
  {
    id: "c1",
    doctor: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    status: "COMPLETED",
    date: "Oct 24, 2023 • 10:30 AM",
  },
];

// Routes are assumptions: rename to match your app.

export const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Doctors", href: "/doctors", icon: Stethoscope },
  { label: "Records", href: "/records", icon: ClipboardPlus },
  { label: "Profile", href: "/profile", icon: User },
];
export const CHAT_ITEM = {
  label: "Chat",
  href: "/chat",
  icon: MessageCircleText,
};
