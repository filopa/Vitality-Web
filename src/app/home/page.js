import BottomNav from "../_components/dashboard/BottomNav";
import DashboardHeader from "../_components/dashboard/DashboardHeader";
import EmergencyCard from "../_components/dashboard/EmergencyCard";
import FeaturedDoctors from "../_components/dashboard/FeaturedDoctors";
import HealthInsights from "../_components/dashboard/HealthInsights";
import PromoBanner from "../_components/dashboard/PromoBanner";
import RecentConsultations from "../_components/dashboard/RecentConsultations";
import SearchBar from "../_components/dashboard/SearchBar";
import Shortcuts from "../_components/dashboard/Shortcuts";
import Specialties from "../_components/dashboard/Specialties";

export const metadata = {
  title: { absolute: "Home | Vitality" },
  robots: { index: false, follow: false }, // private page
};

export default function PatientHomePage() {
  return (
    <div className="min-h-dvh bg-background font-brand text-foreground lg:pl-24">
      <DashboardHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 pb-32 pt-4 lg:pb-12">
        <SearchBar />
        <Specialties />
        <PromoBanner />
        <Shortcuts />
        <FeaturedDoctors />
        <EmergencyCard />

        <div className="grid gap-6 md:grid-cols-2">
          <HealthInsights />
          <RecentConsultations />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
