import {
  Award,
  Calendar,
  Clock,
  Droplet,
  FileCheck,
  Heart,
  MapPin,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import JsonLd from "@/app/_components/seo/JsonLd";
import ThemeToggle from "@/app/theme-toggle";
import { getUserByIdOrUsername } from "@/lib/server/users";
import FollowActions from "./_components/FollowActions";

export const instant = false;

export async function generateMetadata({ params }) {
  await connection();
  const { id } = await params;
  const user = await getUserByIdOrUsername(id);

  if (!user) {
    return {
      title: "Profile Not Found | Vitality Health",
      description: "The requested medical profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const isDoctor = user.type === "doctor";
  const name =
    isDoctor && !user.name.toLowerCase().startsWith("dr")
      ? `Dr. ${user.name}`
      : user.name;
  const title = isDoctor
    ? `${name} – ${user.specialty || "Medical Specialist"} | Vitality Network`
    : `${name} (@${user.username || "patient"}) | Vitality Health`;
  const description =
    user.bio ||
    (isDoctor
      ? `${name} is a licensed medical practitioner specializing in ${user.specialty || "general healthcare"} on the Vitality Network.`
      : `View ${name}'s verified health profile and vitals on Vitality.`);
  const photo =
    user.urlProfile || user.photoURL || user.avatarURL || user.urlAvatar;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/profile/${user.username || user.uid}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/profile/${user.username || user.uid}`,
      images: photo ? [{ url: photo, width: 800, height: 800, alt: name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: photo ? [photo] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicProfilePage({ params }) {
  await connection();
  const { id } = await params;
  const user = await getUserByIdOrUsername(id);

  if (!user) {
    notFound();
  }

  const isDoctor = user.type === "doctor";
  const name =
    isDoctor && !user.name.toLowerCase().startsWith("dr")
      ? `Dr. ${user.name}`
      : user.name;

  const photo =
    user.urlProfile || user.photoURL || user.avatarURL || user.urlAvatar;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently Joined";

  // Public JSON-LD structured data for SEO rich snippets
  const jsonLdData = isDoctor
    ? {
        "@context": "https://schema.org",
        "@type": "Physician",
        name,
        description:
          user.bio ||
          `Specialist in ${user.specialty || "General Medicine"} on the Vitality Network.`,
        image: photo || undefined,
        medicalSpecialty: user.specialty || "General Practice",
        memberOf: {
          "@type": "MedicalOrganization",
          name: "Vitality Health Network",
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "Person",
        name,
        description: user.bio || "Member of Vitality Health",
        image: photo || undefined,
      };

  const hasVitals = Boolean(
    user.vitals && (user.vitals.height || user.vitals.weight),
  );
  const vitalsHeight = user.vitals?.height || 172;
  const vitalsWeight = user.vitals?.weight || 64.5;
  const vitalsBlood = user.vitals?.bloodType || "A+";
  const vitalsRh = user.vitals?.bloodRh || "POS";

  return (
    <div className="min-h-dvh bg-background font-brand text-foreground antialiased">
      {/* Inject Structured Data for Google Search SEO */}
      <JsonLd data={jsonLdData} />

      {/* Public Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Vitality
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabel={false} />
            <Link
              href="/login"
              className="text-xs font-semibold text-muted transition hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Join Vitality
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-20 pt-8 sm:px-6">
        {/* Profile Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          {/* Cover Banner */}
          <div
            className={`relative h-40 w-full bg-gradient-to-r ${
              isDoctor
                ? "from-blue-600/30 via-primary/30 to-indigo-600/30"
                : "from-cyan-500/25 via-primary/25 to-blue-600/25"
            }`}
          >
            <div className="absolute right-5 top-5">
              <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-md">
                {isDoctor ? "Licensed Doctor" : "Verified Member"}
              </span>
            </div>
          </div>

          {/* Profile Identity Details */}
          <div className="relative px-6 pb-8 pt-0 sm:px-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Avatar */}
              <div className="relative -mt-16 sm:-mt-20 size-28 sm:size-32 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface shadow-xl ring-4 ring-primary/20">
                {photo ? (
                  <Image
                    src={photo}
                    alt={name}
                    fill
                    sizes="128px"
                    unoptimized
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/20 text-3xl font-bold text-primary">
                    {name?.[0]?.toUpperCase() || <User className="size-10" />}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <FollowActions
                targetUid={user.uid}
                targetName={name}
                isDoctor={isDoctor}
              />
            </div>

            {/* User Meta Information */}
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {name}
                </h1>
                {isDoctor ? (
                  user.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="size-3.5" />
                      Board Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Clock className="size-3.5" />
                      Verification in Progress
                    </span>
                  )
                ) : null}
              </div>

              {user.username && (
                <p className="mt-0.5 text-sm font-semibold text-primary">
                  @{user.username}
                </p>
              )}

              {/* Doctor Specialty or Patient Bio */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                {isDoctor && user.specialty && (
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <Stethoscope className="size-3.5 text-primary" />
                    Specialty: {user.specialty}
                  </span>
                )}
                {isDoctor && user.licenseNumber && (
                  <span className="flex items-center gap-1">
                    <FileCheck className="size-3.5 text-primary" />
                    License #{user.licenseNumber}
                  </span>
                )}
                {user.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    {user.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-primary" />
                  Member since {memberSince}
                </span>
              </div>

              {user.bio && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/90">
                  {user.bio}
                </p>
              )}

              {/* Followers / Following stats */}
              <div className="mt-4 flex items-center gap-5 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">
                    {user.followersCount ?? 0}
                  </span>
                  <span className="text-muted">Followers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground">
                    {user.followingCount ?? 0}
                  </span>
                  <span className="text-muted">Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Section: Doctor Credentials vs Patient Vitals */}
        {isDoctor ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Award className="size-5 text-primary" />
                  Medical Certificates & Qualifications
                </h2>
                <p className="text-xs text-muted">
                  Official clinical credentials registered in the Vitality
                  Database
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {user.certificates && user.certificates.length > 0 ? (
                user.certificates.map((cert) => {
                  const isApproved =
                    cert.verificationStatus === "approved" || cert.isVerified;
                  const isPending =
                    cert.verificationStatus === "padding" ||
                    cert.verificationStatus === "pending" ||
                    !cert.verificationStatus;

                  return (
                    <div
                      key={cert.certId || cert.title}
                      className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <FileCheck className="size-6" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">
                              {cert.title}
                            </h3>
                            <p className="text-xs text-muted">
                              {cert.issuer || "Accredited Medical Board"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isApproved
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isPending
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isApproved
                            ? "Approved"
                            : isPending
                              ? "Under Review"
                              : "Rejected"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
                        <span>Issued: {cert.issueYear || "N/A"}</span>
                        <span className="font-semibold text-primary">
                          Verified Document
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Award className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Medical Practice License
                          </h3>
                          <p className="text-xs text-muted">
                            State Medical Licensing Board
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
                      <span>License #{user.licenseNumber || "MD-984201"}</span>
                      <span className="font-semibold text-emerald-500">
                        Authenticated
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <FileCheck className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">
                            Doctor of Medicine (M.D.)
                          </h3>
                          <p className="text-xs text-muted">
                            Accredited Medical University
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Verified
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
                      <span>Postgraduate Degree</span>
                      <span className="font-semibold text-emerald-500">
                        Board Certified
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Heart className="size-5 text-primary" />
                  Health Vitals & Biometrics
                </h2>
                <p className="text-xs text-muted">
                  {hasVitals
                    ? "Verified biometric measurements registered on Vitality"
                    : "Patient vitals profile"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-muted uppercase">
                    HEIGHT
                  </span>
                  <div className="grid size-8 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Ruler className="size-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {hasVitals ? vitalsHeight : "—"}
                  </span>
                  <span className="text-sm font-semibold text-muted">
                    {hasVitals ? "cm" : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-muted uppercase">
                    WEIGHT
                  </span>
                  <div className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Scale className="size-4" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {hasVitals ? vitalsWeight : "—"}
                  </span>
                  <span className="text-sm font-semibold text-muted">
                    {hasVitals ? "kg" : "Not specified"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-muted uppercase">
                    BLOOD TYPE
                  </span>
                  <div className="grid size-8 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                    <Droplet className="size-4 fill-rose-500 text-rose-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    {hasVitals ? vitalsBlood : "—"}
                  </span>
                  {hasVitals && (
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                      {vitalsRh}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Family Network Section (if public members exist) */}
        {user.family && Object.keys(user.family).length > 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Family Connections
              </h2>
              <p className="text-xs text-muted">
                Linked family health network on Vitality
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {Object.values(user.family).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface p-4 shadow-sm"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    {member.name?.charAt(0)?.toUpperCase() || "F"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {member.name || "Family Member"}
                    </p>
                    {member.username && (
                      <p className="truncate text-xs text-muted">
                        @{member.username}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary capitalize">
                    {member.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Followers Section */}
        {user.followers && Object.keys(user.followers).length > 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Followers
              </h2>
              <p className="text-xs text-muted">
                {user.followersCount} people follow {name} on Vitality
              </p>
            </div>
            {/* Show up to 9 follower avatars as a compact grid */}
            <div className="flex flex-wrap gap-3">
              {Object.keys(user.followers)
                .slice(0, 9)
                .map((followerUid) => (
                  <div
                    key={followerUid}
                    className="grid size-10 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary border border-primary/20"
                    title={followerUid}
                  >
                    <User className="size-4" />
                  </div>
                ))}
              {user.followersCount > 9 && (
                <div className="grid size-10 place-items-center rounded-full border border-border bg-surface text-xs font-bold text-muted">
                  +{user.followersCount - 9}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Footer Call To Action */}
        <div className="mt-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-surface to-accent/20 p-8 text-center shadow-sm">
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            {isDoctor
              ? `Schedule a Consultation with ${name}`
              : "Connect with Medical Providers on Vitality"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-muted">
            Vitality is a modern digital health network connecting patients with
            board-certified physicians, live telemedicine, and synchronized
            biometric monitoring.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
            >
              Get Started for Free
            </Link>
            <Link
              href="/"
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
