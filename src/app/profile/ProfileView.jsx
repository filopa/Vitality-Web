"use client";

import {
  Activity,
  AlertCircle,
  Bell,
  BriefcaseMedical,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Droplet,
  Heart,
  Link2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BottomNav from "@/app/_components/dashboard/BottomNav";
import ThemeToggle from "@/app/theme-toggle";
import { useApp } from "@/lib/AppProvider";
import { authedFetch } from "@/lib/client/api";
import { auth } from "@/lib/firebase";

const GLASS_CARD =
  "rounded-2xl border border-border/70 bg-surface/90 text-surface-foreground shadow-[0_4px_16px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all hover:border-border hover:shadow-[0_6px_24px_rgba(15,23,42,0.07)]";

// Compress client uploaded image to lightweight WebP data URL
function compressImage(dataUrl, maxWidth, maxHeight, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const webpUrl = canvas.toDataURL("image/webp", quality);
        if (webpUrl.startsWith("data:image/webp")) {
          resolve(webpUrl);
          return;
        }
      } catch {}
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function calculateAge(birthdayStr) {
  if (!birthdayStr) return null;
  const birthDate = new Date(birthdayStr);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ProfileView() {
  const { userData, refreshSession } = useApp();
  const fileInputRef = useRef(null);

  // Profile data state matching RTDB schema (automatically using Google photo if available)
  const [profile, setProfile] = useState({
    uid: userData?.uid || "",
    name: userData?.name || "Patient",
    username: userData?.username || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    country: userData?.country || "",
    gender: userData?.gender || "",
    birthday: userData?.birthday || "",
    bio: userData?.bio || "",
    type: userData?.type || "user",
    avatarUrl:
      userData?.urlProfile ||
      userData?.photoURL ||
      userData?.avatarURL ||
      userData?.urlAvatar ||
      auth.currentUser?.photoURL ||
      "",
    memberSince: userData?.createdAt
      ? new Date(userData.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "October 2021",
  });

  // Health Metrics / Vitals State
  const [vitals, setVitals] = useState({
    height: userData?.vitals?.height || 172,
    weight: userData?.vitals?.weight || 64.5,
    bloodType: userData?.vitals?.bloodType || "A+",
    bloodRh: userData?.vitals?.bloodRh || "POS",
    lastSynced: userData?.vitals?.lastSynced || "Today, 10:42 AM",
  });

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({
    name: userData?.emergencyContact?.name || "James Richardson",
    relationship: userData?.emergencyContact?.relationship || "Spouse",
    phone: userData?.emergencyContact?.phone || "+1 (555) 012-3456",
    notes:
      userData?.emergencyContact?.notes ||
      "Primary health proxy and medical decision surrogate",
  });

  // Integrations state
  const [integrations] = useState([
    {
      id: "apple-health",
      name: "Apple Health",
      provider: "Apple HealthKit iOS",
      synced: true,
      lastSync: "2 mins ago",
      metrics: "Heart rate, daily steps (8,420), sleep (7h 24m)",
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      icon: Heart,
    },
    {
      id: "fitbit-pro",
      name: "Fitbit Pro",
      provider: "Fitbit Sense 2",
      synced: true,
      lastSync: "8 mins ago",
      metrics: "Resting HR (62 bpm), SpO2 (98%), active zones",
      color:
        "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      icon: Activity,
    },
  ]);

  // Modal & Async states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditVitalsOpen, setIsEditVitalsOpen] = useState(false);
  const [isEditEmergencyOpen, setIsEditEmergencyOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Temporary edit states
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempVitals, setTempVitals] = useState(vitals);
  const [tempEmergency, setTempEmergency] = useState(emergencyContact);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Sync state whenever userData updates from AppProvider
  useEffect(() => {
    if (userData) {
      setProfile((prev) => ({
        ...prev,
        uid: userData.uid || prev.uid,
        name: userData.name || prev.name,
        username: userData.username || prev.username,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        country: userData.country || prev.country,
        gender: userData.gender || prev.gender,
        birthday: userData.birthday || prev.birthday,
        bio: userData.bio || prev.bio,
        type: userData.type || prev.type,
        avatarUrl:
          userData.urlProfile ||
          userData.photoURL ||
          userData.avatarURL ||
          userData.urlAvatar ||
          auth.currentUser?.photoURL ||
          prev.avatarUrl,
        memberSince: userData.createdAt
          ? new Date(userData.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : prev.memberSince,
      }));

      if (userData.vitals) {
        setVitals(userData.vitals);
      }
      if (userData.emergencyContact) {
        setEmergencyContact(userData.emergencyContact);
      }
    }
  }, [userData]);

  // Query real profile on mount to ensure RTDB fresh data
  useEffect(() => {
    let cancelled = false;
    async function fetchRealProfile() {
      try {
        const res = await authedFetch("/api/auth/user/profile");
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.success && json.data?.profile) {
          const p = json.data.profile;
          setProfile({
            uid: p.uid || "",
            name: p.name || "Patient",
            username: p.username || "",
            email: p.email || "",
            phone: p.phone || "",
            country: p.country || "",
            gender: p.gender || "",
            birthday: p.birthday || "",
            bio: p.bio || "",
            type: p.type || "user",
            avatarUrl:
              p.urlProfile ||
              p.photoURL ||
              p.avatarURL ||
              p.urlAvatar ||
              auth.currentUser?.photoURL ||
              "",
            memberSince: p.createdAt
              ? new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "October 2021",
          });
          if (p.vitals) setVitals(p.vitals);
          if (p.emergencyContact) setEmergencyContact(p.emergencyContact);
        }
      } catch (err) {
        console.error("Could not fetch user profile:", err);
      }
    }
    fetchRealProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // BMI calculation
  const currentHeight = vitals.height || 172;
  const currentWeight = vitals.weight || 64.5;
  const bmi = (
    currentWeight /
    ((currentHeight / 100) * (currentHeight / 100))
  ).toFixed(1);

  const getBmiStatus = (bmiValue) => {
    const val = Number.parseFloat(bmiValue);
    if (val < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (val < 25) return { label: "Healthy BMI", color: "text-emerald-500" };
    if (val < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-rose-500" };
  };

  const bmiStatus = getBmiStatus(bmi);
  const heightInInches = currentHeight / 2.54;
  const feet = Math.floor(heightInInches / 12);
  const inches = Math.round(heightInInches % 12);
  const weightLbs = (currentWeight * 2.20462).toFixed(1);
  const userAge = calculateAge(profile.birthday);

  // ── Handlers ─────────────────────────────────────────────────────────────

  // Save Personal Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError("");
    setSavingProfile(true);

    try {
      const payload = {
        name: tempProfile.name.trim(),
        username: tempProfile.username.trim().toLowerCase(),
        phone: tempProfile.phone.trim(),
        country: tempProfile.country.trim(),
        gender: tempProfile.gender,
        birthday: tempProfile.birthday,
        bio: tempProfile.bio.trim(),
      };

      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.message ||
            json.data?.errors?.username ||
            "Failed to save profile changes.",
        );
      }

      setProfile((prev) => ({ ...prev, ...payload }));
      await refreshSession();
      setIsEditProfileOpen(false);
      showToast("Profile details updated in RTDB!");
    } catch (err) {
      setFormError(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Vitals
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    setFormError("");
    setSavingVitals(true);

    try {
      const payload = {
        vitals: {
          height: Number(tempVitals.height),
          weight: Number(tempVitals.weight),
          bloodType: tempVitals.bloodType,
          bloodRh: tempVitals.bloodRh,
          lastSynced: "Just now",
        },
      };

      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save vitals.");
      }

      setVitals(payload.vitals);
      await refreshSession();
      setIsEditVitalsOpen(false);
      showToast("Vitals saved to database!");
    } catch (err) {
      setFormError(err.message || "Could not save vitals.");
    } finally {
      setSavingVitals(false);
    }
  };

  // Save Emergency Contact
  const handleSaveEmergency = async (e) => {
    e.preventDefault();
    setFormError("");
    setSavingEmergency(true);

    try {
      const payload = {
        emergencyContact: {
          name: tempEmergency.name.trim(),
          relationship: tempEmergency.relationship.trim(),
          phone: tempEmergency.phone.trim(),
          notes: (tempEmergency.notes || "").trim(),
        },
      };

      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save emergency contact.");
      }

      setEmergencyContact(payload.emergencyContact);
      await refreshSession();
      setIsEditEmergencyOpen(false);
      showToast("Emergency contact saved to database!");
    } catch (err) {
      setFormError(err.message || "Could not save emergency contact.");
    } finally {
      setSavingEmergency(false);
    }
  };

  // Photo Upload Handler (Device file upload)
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Please choose an image under 5MB.");
      return;
    }

    setPhotoActionLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawDataUrl = event.target?.result;
        if (typeof rawDataUrl !== "string") return;

        // Compress to responsive WebP
        const compressedWebp = await compressImage(rawDataUrl, 400, 400, 0.85);

        const res = await authedFetch("/api/auth/user/profile", {
          method: "PATCH",
          body: JSON.stringify({
            urlProfile: compressedWebp,
            urlAvatar: compressedWebp,
            photoURL: compressedWebp,
            avatarURL: compressedWebp,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Photo upload failed.");
        }

        setProfile((prev) => ({ ...prev, avatarUrl: compressedWebp }));
        await refreshSession();
        setIsPhotoModalOpen(false);
        showToast("Profile photo updated successfully!");
      } catch (err) {
        showToast(err.message || "Failed to upload photo.");
      } finally {
        setPhotoActionLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    setPhotoActionLoading(true);
    try {
      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          urlProfile: "",
          urlAvatar: "",
          photoURL: "",
          avatarURL: "",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not remove photo.");
      }

      setProfile((prev) => ({ ...prev, avatarUrl: "" }));
      await refreshSession();
      setIsPhotoModalOpen(false);
      showToast("Profile photo removed.");
    } catch (err) {
      showToast(err.message || "Failed to remove photo.");
    } finally {
      setPhotoActionLoading(false);
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setVitals((v) => ({ ...v, lastSynced: "Just now" }));
      showToast("Synced telemetry from Apple Health & Fitbit Pro!");
    }, 1200);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
      window.location.assign("/login");
    } catch {
      window.location.assign("/");
    }
  };

  return (
    <div className="min-h-dvh bg-background font-brand text-foreground antialiased lg:pl-24">
      {/* Hidden File Input for Device Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        tabIndex={-1}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Desktop & Tablet Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          {/* Brand & Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Vitals & Health Profile
                </h1>
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-muted">
                Personal medical record, biometric telemetry, and account
                settings
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent sm:inline-flex"
            >
              <RefreshCw
                className={`size-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>{isSyncing ? "Syncing…" : "Sync Vitals"}</span>
            </button>

            <ThemeToggle showLabel={false} />

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex size-10 items-center justify-center rounded-full border border-border/70 bg-surface text-foreground shadow-sm transition hover:bg-accent hover:text-primary"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-surface" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-32 pt-6 sm:px-6 lg:pb-16 lg:pt-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-xl lg:bottom-8">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ================= LEFT COLUMN: User Card & Emergency Contact ================= */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Identity Card */}
            <div className={`overflow-hidden ${GLASS_CARD}`}>
              {/* Decorative Cover Gradient */}
              <div className="relative h-28 w-full bg-gradient-to-r from-cyan-500/20 via-primary/25 to-blue-600/20 dark:from-cyan-900/30 dark:via-primary/20 dark:to-blue-900/30">
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-md">
                    UID #
                    {profile.uid
                      ? profile.uid.slice(0, 8).toUpperCase()
                      : "VT-USER"}
                  </span>
                </div>
              </div>

              {/* Profile Avatar & Info */}
              <div className="relative flex flex-col items-center px-6 pb-6 pt-0 text-center">
                {/* Avatar with cyan ring and edit camera badge */}
                <div className="relative -mt-14 mb-4">
                  <div className="relative size-24 overflow-hidden rounded-full border-4 border-surface bg-surface shadow-md ring-2 ring-primary/40">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.name}
                        fill
                        sizes="96px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary/20 text-2xl font-bold text-primary">
                        {profile.name?.[0]?.toUpperCase() || (
                          <User className="size-8" />
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    aria-label="Change Photo"
                    title="Change Photo"
                    className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:scale-110 active:scale-95"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>

                {/* Name & Subtitle */}
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {profile.name}
                </h2>
                {profile.username && (
                  <p className="text-xs font-semibold text-primary">
                    @{profile.username}
                  </p>
                )}
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                  <Calendar className="size-3.5 text-primary" />
                  Member since {profile.memberSince}
                </p>

                {/* Patient tags */}
                <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
                  <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-accent-foreground capitalize">
                    {profile.type}
                  </span>
                  {profile.gender && (
                    <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-accent-foreground capitalize">
                      {profile.gender}
                    </span>
                  )}
                  {userAge !== null && (
                    <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      {userAge} yrs
                    </span>
                  )}
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                {/* Bio (if available) */}
                {profile.bio && (
                  <p className="mt-3 max-w-xs text-xs italic text-muted">
                    &quot;{profile.bio}&quot;
                  </p>
                )}

                {/* Contact & Location Details */}
                <div className="mt-4 flex w-full flex-col gap-2 rounded-xl border border-border/50 bg-background/50 p-3 text-left text-xs text-muted">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate text-foreground font-medium">
                        {profile.email || "No email"}
                      </span>
                    </div>
                    <span
                      title="Email is locked to your account"
                      className="inline-flex shrink-0 items-center gap-1 rounded bg-muted/20 px-1.5 py-0.5 text-[10px] text-muted"
                    >
                      <Lock className="size-2.5" /> Locked
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0 text-primary" />
                    <span className="text-foreground font-medium">
                      {profile.phone || "No phone added"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span>{profile.country || "Country not set"}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    setTempProfile(profile);
                    setFormError("");
                    setIsEditProfileOpen(true);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  <Pencil className="size-3.5" />
                  Edit Profile Info
                </button>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className={`p-5 ${GLASS_CARD}`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <BriefcaseMedical className="size-4" />
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    Emergency Contact
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempEmergency(emergencyContact);
                    setFormError("");
                    setIsEditEmergencyOpen(true);
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Emergency Contact Detail Row */}
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-background/60 p-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-500 shadow-sm">
                  <BriefcaseMedical className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-foreground">
                    {emergencyContact.name || "Add contact name"}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {emergencyContact.relationship || "Relationship"} •{" "}
                    {emergencyContact.phone || "Phone number"}
                  </p>
                </div>
              </div>

              {emergencyContact.notes && (
                <p className="mt-2.5 text-xs text-muted">
                  Note: {emergencyContact.notes}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={`tel:${emergencyContact.phone.replace(/[^0-9+]/g, "")}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent"
                >
                  <Phone className="size-3.5 text-emerald-500" />
                  Call Contact
                </a>
                <button
                  type="button"
                  onClick={() => showToast("Emergency SOS broadcast prepared.")}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-400"
                >
                  ICE Alert
                </button>
              </div>
            </div>

            {/* Sign Out Card */}
            <div className={`p-5 ${GLASS_CARD}`}>
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-500 hover:text-white dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-600"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>

              <p className="mt-4 text-center text-xs text-muted">
                App Version 2.4.1 (Build 890)
              </p>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Vitals, Settings & Integrations ================= */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* 1. HEALTH METRICS / VITALS SECTION */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    Health Metrics & Vitals
                  </h3>
                  <p className="text-xs text-muted">
                    Continuous biometric stream • Synced {vitals.lastSynced}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempVitals(vitals);
                    setFormError("");
                    setIsEditVitalsOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                >
                  <Pencil className="size-3" />
                  Update Vitals
                </button>
              </div>

              {/* 3 Metric Cards matching Mobile Screen (HEIGHT, WEIGHT, BLOOD TYPE) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* HEIGHT CARD */}
                <div
                  className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-muted uppercase">
                      HEIGHT
                    </span>
                    <div className="grid size-8 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Ruler className="size-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                      {vitals.height}
                    </span>
                    <span className="text-sm font-semibold text-muted">cm</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                    <span>
                      {feet}&apos; {inches}&quot;
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                      Adult Standard
                    </span>
                  </div>
                </div>

                {/* WEIGHT CARD */}
                <div
                  className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-muted uppercase">
                      WEIGHT
                    </span>
                    <div className="grid size-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Scale className="size-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                      {vitals.weight}
                    </span>
                    <span className="text-sm font-semibold text-muted">kg</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                    <span>{weightLbs} lbs</span>
                    <span className={`font-semibold ${bmiStatus.color}`}>
                      BMI {bmi}
                    </span>
                  </div>
                </div>

                {/* BLOOD TYPE CARD */}
                <div
                  className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-muted uppercase">
                      BLOOD TYPE
                    </span>
                    <div className="grid size-8 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                      <Droplet className="size-4 fill-rose-500 text-rose-500" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                      {vitals.bloodType}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                      {vitals.bloodRh}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                    <span>
                      Rh {vitals.bloodRh === "POS" ? "Positive" : "Negative"}
                    </span>
                    <span className="font-medium text-foreground">
                      Donor Match
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SECURITY & PREFERENCES SECTION (Matching Mobile Screen List) */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-foreground">
                Account & Security Settings
              </h3>

              <div
                className={`divide-y divide-border/60 overflow-hidden ${GLASS_CARD}`}
              >
                {/* Security Item */}
                <div className="flex items-center justify-between p-4.5 transition hover:bg-surface/50">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-11 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Security
                      </h4>
                      <p className="text-xs text-muted">
                        Face ID, 2FA, Passwords
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:inline-block">
                      2FA Enabled
                    </span>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                </div>

                {/* Notifications Item */}
                <div className="flex items-center justify-between p-4.5 transition hover:bg-surface/50">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-11 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Notifications
                      </h4>
                      <p className="text-xs text-muted">
                        Reminders, Appointments, Alerts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground sm:inline-block">
                      Push & Email
                    </span>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                </div>

                {/* Linked Healthcare Apps Item */}
                <div className="flex items-center justify-between p-4.5 transition hover:bg-surface/50">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-11 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <Link2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Linked Healthcare Apps
                      </h4>
                      <p className="text-xs text-muted">
                        Apple Health, Fitbit, MyFitnessPal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:inline-block">
                      2 Connected
                    </span>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ACTIVE INTEGRATIONS SECTION (Matching Mobile Screen Grid) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-muted uppercase">
                    ACTIVE INTEGRATIONS
                  </h3>
                  <p className="text-xs text-muted">
                    Real-time telemetry and biometrics streaming into Vitality
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opening device pairing wizard…")}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  Link Device
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {integrations.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid size-12 place-items-center rounded-2xl border ${item.color} shadow-sm`}
                          >
                            <Icon className="size-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-foreground">
                              {item.name}
                            </h4>
                            <p className="text-xs text-muted">
                              {item.provider}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                          SYNCED
                        </span>
                      </div>

                      <p className="mt-3.5 text-xs text-muted leading-relaxed">
                        {item.metrics}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                        <span className="text-muted">
                          Last sync: {item.lastSync}
                        </span>
                        <button
                          type="button"
                          onClick={handleManualSync}
                          className="font-semibold text-primary transition hover:underline"
                        >
                          Sync Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= PHOTO MANAGEMENT MODAL ================= */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-modal-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3
                id="photo-modal-title"
                className="text-lg font-bold text-foreground"
              >
                Profile Photo
              </h3>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="relative size-24 overflow-hidden rounded-full border-4 border-surface shadow-lg ring-2 ring-primary/40">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.name}
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/20 text-2xl font-bold text-primary">
                    {profile.name?.[0]?.toUpperCase() || (
                      <User className="size-8" />
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted">
                Formats: PNG, JPG, or WEBP (Max 5MB)
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              {/* Upload from Computer */}
              <button
                type="button"
                disabled={photoActionLoading}
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
              >
                <Upload className="size-4" />
                {photoActionLoading ? "Processing…" : "Upload from Device"}
              </button>

              {/* Remove Photo */}
              {profile.avatarUrl && (
                <button
                  type="button"
                  disabled={photoActionLoading}
                  onClick={handleRemovePhoto}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/20 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  Remove Current Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT VITALS MODAL ================= */}
      {isEditVitalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-vitals-title"
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3
                id="edit-vitals-title"
                className="text-lg font-bold text-foreground"
              >
                Update Vitals & Body Metrics
              </h3>
              <button
                type="button"
                onClick={() => setIsEditVitalsOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveVitals}
              className="mt-4 flex flex-col gap-4"
            >
              {/* Height */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="height-input"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Height (cm)
                </label>
                <input
                  id="height-input"
                  type="number"
                  min="50"
                  max="250"
                  value={tempVitals.height}
                  onChange={(e) =>
                    setTempVitals({
                      ...tempVitals,
                      height: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Weight */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="weight-input"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Weight (kg)
                </label>
                <input
                  id="weight-input"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={tempVitals.weight}
                  onChange={(e) =>
                    setTempVitals({
                      ...tempVitals,
                      weight: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Blood Type & Rh */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="blood-type-select"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Blood Type
                  </label>
                  <select
                    id="blood-type-select"
                    value={tempVitals.bloodType}
                    onChange={(e) =>
                      setTempVitals({
                        ...tempVitals,
                        bloodType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="rh-factor-select"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Rh Factor
                  </label>
                  <select
                    id="rh-factor-select"
                    value={tempVitals.bloodRh}
                    onChange={(e) =>
                      setTempVitals({
                        ...tempVitals,
                        bloodRh: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="POS">Positive (Rh+)</option>
                    <option value="NEG">Negative (Rh-)</option>
                  </select>
                </div>
              </div>

              {/* Live BMI preview */}
              <div className="rounded-xl border border-border/70 bg-accent/30 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Projected BMI:
                  </span>
                  <span className="font-bold text-primary">
                    {(
                      tempVitals.weight /
                      ((tempVitals.height / 100) * (tempVitals.height / 100))
                    ).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditVitalsOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVitals}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingVitals ? "Saving to RTDB…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT EMERGENCY CONTACT MODAL ================= */}
      {isEditEmergencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-emergency-title"
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3
                id="edit-emergency-title"
                className="text-lg font-bold text-foreground"
              >
                Edit Emergency Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsEditEmergencyOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveEmergency}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="contact-name"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Contact Full Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={tempEmergency.name}
                  onChange={(e) =>
                    setTempEmergency({
                      ...tempEmergency,
                      name: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. James Richardson"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="contact-rel"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Relationship
                </label>
                <input
                  id="contact-rel"
                  type="text"
                  value={tempEmergency.relationship}
                  onChange={(e) =>
                    setTempEmergency({
                      ...tempEmergency,
                      relationship: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. Spouse, Father, Mother, Sibling, Doctor"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="contact-phone"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={tempEmergency.phone}
                  onChange={(e) =>
                    setTempEmergency({
                      ...tempEmergency,
                      phone: e.target.value,
                    })
                  }
                  required
                  placeholder="+1 (555) 012-3456"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="contact-notes"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Emergency Notes / Directives
                </label>
                <input
                  id="contact-notes"
                  type="text"
                  value={tempEmergency.notes || ""}
                  onChange={(e) =>
                    setTempEmergency({
                      ...tempEmergency,
                      notes: e.target.value,
                    })
                  }
                  placeholder="e.g. Authorized medical decision surrogate, Penicillin allergy"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </div>

              <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditEmergencyOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEmergency}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingEmergency ? "Saving to RTDB…" : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PROFILE INFO MODAL ================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3
                  id="edit-profile-title"
                  className="text-lg font-bold text-foreground"
                >
                  Edit Profile Information
                </h3>
                <p className="text-xs text-muted">
                  Update your identity details saved in Firebase RTDB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveProfile}
              className="mt-4 flex flex-col gap-4"
            >
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="profile-name"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Full Name (2–50 characters)
                </label>
                <input
                  id="profile-name"
                  type="text"
                  minLength={2}
                  maxLength={50}
                  value={tempProfile.name}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, name: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="profile-username"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Username (unique, lowercase, letters/numbers/_)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-muted">
                    @
                  </span>
                  <input
                    id="profile-username"
                    type="text"
                    value={tempProfile.username}
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ""),
                      })
                    }
                    placeholder="username"
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              {/* Email (Read-only as per instructions "except for email") */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile-email-readonly"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Email Address
                  </label>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
                    <Lock className="size-3" /> Cannot be changed
                  </span>
                </div>
                <input
                  id="profile-email-readonly"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-border/60 bg-muted/10 px-4 py-2.5 text-sm text-muted outline-none select-none"
                />
              </div>

              {/* Phone & Country Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-phone"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={tempProfile.phone}
                    onChange={(e) =>
                      setTempProfile({ ...tempProfile, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-country"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Country / Location
                  </label>
                  <input
                    id="profile-country"
                    type="text"
                    maxLength={150}
                    value={tempProfile.country}
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        country: e.target.value,
                      })
                    }
                    placeholder="e.g. United States"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              {/* Gender & Birthday Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-gender"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Gender
                  </label>
                  <select
                    id="profile-gender"
                    value={tempProfile.gender}
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        gender: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="profile-birthday"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Birthday
                  </label>
                  <input
                    id="profile-birthday"
                    type="date"
                    value={tempProfile.birthday}
                    onChange={(e) =>
                      setTempProfile({
                        ...tempProfile,
                        birthday: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              {/* Bio (string up to 150 chars per schema) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile-bio"
                    className="text-xs font-semibold text-muted uppercase"
                  >
                    Bio
                  </label>
                  <span className="text-[11px] text-muted">
                    {tempProfile.bio?.length || 0}/150
                  </span>
                </div>
                <textarea
                  id="profile-bio"
                  maxLength={150}
                  rows={2}
                  value={tempProfile.bio}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, bio: e.target.value })
                  }
                  placeholder="Short health summary or personal note…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary resize-none"
                />
              </div>

              <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingProfile ? "Saving to RTDB…" : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SIGN OUT CONFIRMATION MODAL ================= */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-labelledby="signout-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-red-500/10 text-red-500">
              <LogOut className="size-6" />
            </div>

            <h3
              id="signout-title"
              className="text-lg font-bold text-foreground"
            >
              Sign out of Vitality?
            </h3>
            <p className="mt-1 text-xs text-muted">
              You will need to sign back in to access your health records and
              active integrations.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsSignOutModalOpen(false)}
                className="flex-1 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation (Left Sidebar on Desktop, Bottom Pill on Mobile) */}
      <BottomNav />
    </div>
  );
}
