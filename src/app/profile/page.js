import ProfileView from "./ProfileView";

export const metadata = {
  title: { absolute: "Profile & Vitals | Vitality" },
  description:
    "Manage your health profile, body metrics, emergency contact, and linked healthcare integrations.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
