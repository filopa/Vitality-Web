"use client";

import {
  Activity,
  AlertCircle,
  Award,
  Bell,
  BriefcaseMedical,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Droplet,
  ExternalLink,
  FileCheck,
  FileText,
  GraduationCap,
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
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  User,
  UserPlus,
  Users,
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

function formatMemberDate(timestamp) {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── File drop zone for doctor document uploads ──────────────────────────────
function FileDropZone({
  label,
  required = false,
  accept = ".pdf,.jpg,.jpeg,.png",
  hint = "PDF, JPG, or PNG — max 10 MB",
  currentFileName = "",
  file = null,
  onFileChange,
  error = "",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const displayFileName = file ? file.name : currentFileName;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {/* biome-ignore lint/a11y/useSemanticElements: file drop zone container with nested clear button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) onFileChange(dropped);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          dragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-red-400 bg-red-50 dark:bg-red-950/20"
              : displayFileName
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-surface hover:border-primary/50"
        }`}
      >
        {displayFileName ? (
          <>
            <FileText className="h-6 w-6 text-primary" />
            <span className="max-w-[220px] truncate text-xs font-medium text-surface-foreground font-mono">
              {displayFileName}
            </span>
            <span className="text-[10px] font-semibold text-primary">
              Click or drop to replace document
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full p-1 text-muted hover:text-red-500"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted" />
            <span className="text-xs text-muted">
              <span className="font-semibold text-primary">
                Click to upload
              </span>{" "}
              or drag & drop
            </span>
            {hint && <span className="text-[11px] text-muted">{hint}</span>}
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFileChange(picked);
        }}
      />

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

const RELATIONSHIP_LABELS = {
  parent: {
    label: "Parent",
    reciprocal: "Child",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  child: {
    label: "Child",
    reciprocal: "Parent",
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  sibling: {
    label: "Sibling",
    reciprocal: "Sibling",
    color:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  spouse: {
    label: "Spouse",
    reciprocal: "Spouse",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  grandparent: {
    label: "Grandparent",
    reciprocal: "Grandchild",
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  grandchild: {
    label: "Grandchild",
    reciprocal: "Grandparent",
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
};

export default function ProfileView() {
  const { userData, refreshSession } = useApp();
  const fileInputRef = useRef(null);

  // Profile data state matching RTDB schema (automatically using Google photo if available)
  const [profile, setProfile] = useState({
    uid: userData?.uid || "",
    name: userData?.name || "User",
    username: userData?.username || "",
    email: userData?.email || "",
    phone: userData?.phone || "",
    country: userData?.country || "",
    gender: userData?.gender || "",
    birthday: userData?.birthday || "",
    bio: userData?.bio || "",
    type: userData?.type || "user",
    specialty: userData?.specialty || "",
    licenseNumber: userData?.licenseNumber || "",
    licenseIssuer: userData?.licenseIssuer || "",
    licenseYear: userData?.licenseYear || "",
    licenseDoc: userData?.licenseDoc || "",
    licenseStatus: userData?.licenseStatus || "padding",
    degreeTitle: userData?.degreeTitle || "",
    degreeIssuer: userData?.degreeIssuer || "",
    degreeYear: userData?.degreeYear || "",
    degreeDoc: userData?.degreeDoc || "",
    degreeStatus: userData?.degreeStatus || "padding",
    verified: userData?.verified || false,
    certificates: userData?.certificates || [],
    family: userData?.family || {},
    avatarUrl:
      userData?.urlProfile ||
      userData?.photoURL ||
      userData?.avatarURL ||
      userData?.urlAvatar ||
      auth.currentUser?.photoURL ||
      "",
    memberSince:
      formatMemberDate(userData?.createdAt) ||
      formatMemberDate(auth.currentUser?.metadata?.creationTime) ||
      "",
  });

  // Track whether real vitals were entered by the user
  const [hasVitals, setHasVitals] = useState(
    Boolean(
      userData?.vitals && (userData.vitals.height || userData.vitals.weight),
    ),
  );

  // Track whether real credentials were provided for doctor
  const [hasDoctorCredentials, setHasDoctorCredentials] = useState(
    Boolean(
      userData?.licenseNumber &&
        (userData?.licenseIssuer ||
          userData?.specialty ||
          userData?.licenseDoc),
    ),
  );

  // Health Metrics / Vitals State (default example values shown when empty)
  const [vitals, setVitals] = useState({
    height: userData?.vitals?.height || null,
    weight: userData?.vitals?.weight || null,
    bloodType: userData?.vitals?.bloodType || "",
    bloodRh: userData?.vitals?.bloodRh || "POS",
    lastSynced: userData?.vitals?.lastSynced || null,
  });

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({
    name: userData?.emergencyContact?.name || "",
    relationship: userData?.emergencyContact?.relationship || "",
    phone: userData?.emergencyContact?.phone || "",
    notes: userData?.emergencyContact?.notes || "",
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
  const [isEditCredentialsOpen, setIsEditCredentialsOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [addingFamily, setAddingFamily] = useState(false);
  const [removingFamilyId, setRemovingFamilyId] = useState(null);
  const [familyUsername, setFamilyUsername] = useState("");
  const [familyType, setFamilyType] = useState("parent");
  const [familyError, setFamilyError] = useState("");
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const [formError, setFormError] = useState("");

  // Temporary edit states
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempVitals, setTempVitals] = useState({
    height: vitals.height || 172,
    weight: vitals.weight || 64.5,
    bloodType: vitals.bloodType || "A+",
    bloodRh: vitals.bloodRh || "POS",
  });
  const [tempEmergency, setTempEmergency] = useState(emergencyContact);
  const [tempCredentials, setTempCredentials] = useState({
    specialty: profile.specialty || "",
    licenseNumber: profile.licenseNumber || "",
    licenseIssuer: profile.licenseIssuer || "",
    licenseYear: profile.licenseYear || "",
    licenseDoc: profile.licenseDoc || "",
    degreeTitle: profile.degreeTitle || "",
    degreeIssuer: profile.degreeIssuer || "",
    degreeYear: profile.degreeYear || "",
    degreeDoc: profile.degreeDoc || "",
  });
  const [tempLicenseFile, setTempLicenseFile] = useState(null);
  const [tempDegreeFile, setTempDegreeFile] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Sync state whenever userData updates from AppProvider
  useEffect(() => {
    if (userData) {
      const userHasVitals = Boolean(
        userData.vitals && (userData.vitals.height || userData.vitals.weight),
      );
      setHasVitals(userHasVitals);

      const doctorHasCreds = Boolean(
        userData.licenseNumber &&
          (userData.licenseIssuer || userData.specialty || userData.licenseDoc),
      );
      setHasDoctorCredentials(doctorHasCreds);

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
        specialty: userData.specialty || prev.specialty,
        licenseNumber: userData.licenseNumber || prev.licenseNumber,
        licenseIssuer: userData.licenseIssuer || prev.licenseIssuer,
        licenseYear: userData.licenseYear || prev.licenseYear,
        licenseDoc: userData.licenseDoc || prev.licenseDoc,
        licenseStatus: userData.licenseStatus || prev.licenseStatus,
        degreeTitle: userData.degreeTitle || prev.degreeTitle,
        degreeIssuer: userData.degreeIssuer || prev.degreeIssuer,
        degreeYear: userData.degreeYear || prev.degreeYear,
        degreeDoc: userData.degreeDoc || prev.degreeDoc,
        degreeStatus: userData.degreeStatus || prev.degreeStatus,
        verified: userData.verified ?? prev.verified,
        certificates: userData.certificates || prev.certificates,
        family: userData.family || prev.family || {},
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
          const userHasVitals = Boolean(
            p.vitals && (p.vitals.height || p.vitals.weight),
          );
          setHasVitals(userHasVitals);

          const doctorHasCreds = Boolean(
            p.licenseNumber && (p.licenseIssuer || p.specialty || p.licenseDoc),
          );
          setHasDoctorCredentials(doctorHasCreds);

          setProfile({
            uid: p.uid || "",
            name: p.name || "User",
            username: p.username || "",
            email: p.email || "",
            phone: p.phone || "",
            country: p.country || "",
            gender: p.gender || "",
            birthday: p.birthday || "",
            bio: p.bio || "",
            type: p.type || "user",
            specialty: p.specialty || "",
            licenseNumber: p.licenseNumber || "",
            licenseIssuer: p.licenseIssuer || "",
            licenseYear: p.licenseYear || "",
            licenseDoc: p.licenseDoc || "",
            licenseStatus: p.licenseStatus || "padding",
            degreeTitle: p.degreeTitle || "",
            degreeIssuer: p.degreeIssuer || "",
            degreeYear: p.degreeYear || "",
            degreeDoc: p.degreeDoc || "",
            degreeStatus: p.degreeStatus || "padding",
            verified: p.verified || false,
            certificates: Array.isArray(p.certificates) ? p.certificates : [],
            family: p.family || {},
            avatarUrl:
              p.urlProfile ||
              p.photoURL ||
              p.avatarURL ||
              p.urlAvatar ||
              auth.currentUser?.photoURL ||
              "",
            memberSince:
              formatMemberDate(p.createdAt) ||
              formatMemberDate(auth.currentUser?.metadata?.creationTime) ||
              "",
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

  const isDoctor =
    profile.type === "doctor" || profile.requestedType === "doctor";

  // BMI calculation (uses real values if saved, else example 172cm / 64.5kg)
  const displayHeight = hasVitals ? vitals.height : 172;
  const displayWeight = hasVitals ? vitals.weight : 64.5;
  const bmi = (
    displayWeight /
    ((displayHeight / 100) * (displayHeight / 100))
  ).toFixed(1);

  const getBmiStatus = (bmiValue) => {
    const val = Number.parseFloat(bmiValue);
    if (val < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (val < 25) return { label: "Healthy BMI", color: "text-emerald-500" };
    if (val < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-rose-500" };
  };

  const bmiStatus = getBmiStatus(bmi);
  const heightInInches = displayHeight / 2.54;
  const feet = Math.floor(heightInInches / 12);
  const inches = Math.round(heightInInches % 12);
  const weightLbs = (displayWeight * 2.20462).toFixed(1);
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
        type: tempProfile.type,
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
      setHasVitals(true);
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

  const publicIdentifier = profile.username || profile.uid || "";
  const publicProfilePath = `/profile/${publicIdentifier}`;

  const handleCopyPublicLink = async () => {
    try {
      const fullUrl = `${window.location.origin}${publicProfilePath}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast("Profile link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast("Failed to copy link.");
    }
  };

  const handleShareProfile = async () => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicProfilePath}`
        : publicProfilePath;
    const shareTitle = isDoctor
      ? `Dr. ${profile.name}'s Medical Profile | Vitality`
      : `${profile.name}'s Health Profile | Vitality`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `View ${profile.name}'s verified profile on Vitality Health:`,
          url: fullUrl,
        });
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          setIsShareModalOpen(true);
        }
        return;
      }
    }
    setIsShareModalOpen(true);
  };

  // Save Doctor Credentials (specialty, license, degree fields)
  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setFormError("");
    setSavingCredentials(true);
    const currentYear = new Date().getFullYear();

    // Client-side validation
    if (
      !tempCredentials.specialty ||
      tempCredentials.specialty.trim().length < 2
    ) {
      setFormError("Medical specialty is required (min 2 characters).");
      setSavingCredentials(false);
      return;
    }
    if (
      !tempCredentials.licenseNumber ||
      tempCredentials.licenseNumber.trim().length < 3
    ) {
      setFormError("License number is required (min 3 characters).");
      setSavingCredentials(false);
      return;
    }
    if (
      !tempCredentials.licenseIssuer ||
      tempCredentials.licenseIssuer.trim().length < 2
    ) {
      setFormError("Issuing institution is required (min 2 characters).");
      setSavingCredentials(false);
      return;
    }
    const parsedLicYear = parseInt(tempCredentials.licenseYear, 10);
    if (!parsedLicYear || parsedLicYear < 1950 || parsedLicYear > currentYear) {
      setFormError(
        `License issue year must be between 1950 and ${currentYear}.`,
      );
      setSavingCredentials(false);
      return;
    }
    const licenseDocName = tempLicenseFile
      ? tempLicenseFile.name
      : (tempCredentials.licenseDoc || "").trim();
    if (!licenseDocName) {
      setFormError(
        "A license document is required. Please upload your document.",
      );
      setSavingCredentials(false);
      return;
    }

    const degreeDocName = tempDegreeFile
      ? tempDegreeFile.name
      : (tempCredentials.degreeDoc || "").trim();

    if (tempCredentials.degreeYear) {
      const parsedDegYear = parseInt(tempCredentials.degreeYear, 10);
      if (parsedDegYear < 1950 || parsedDegYear > currentYear) {
        setFormError(
          `Graduation year must be between 1950 and ${currentYear}.`,
        );
        setSavingCredentials(false);
        return;
      }
    }

    try {
      const payload = {
        specialty: tempCredentials.specialty.trim(),
        licenseNumber: tempCredentials.licenseNumber.trim(),
        licenseIssuer: tempCredentials.licenseIssuer.trim(),
        licenseYear: parsedLicYear,
        licenseDoc: licenseDocName,
        ...(tempCredentials.degreeTitle?.trim() && {
          degreeTitle: tempCredentials.degreeTitle.trim(),
        }),
        ...(tempCredentials.degreeIssuer?.trim() && {
          degreeIssuer: tempCredentials.degreeIssuer.trim(),
        }),
        ...(tempCredentials.degreeYear && {
          degreeYear: parseInt(tempCredentials.degreeYear, 10),
        }),
        ...(degreeDocName && {
          degreeDoc: degreeDocName,
        }),
      };

      const res = await authedFetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save credentials.");
      }

      // Update local profile state with saved values + re-read certificates from response
      const updatedProfile = json.data?.profile;
      setProfile((prev) => ({
        ...prev,
        specialty: payload.specialty,
        licenseNumber: payload.licenseNumber,
        licenseIssuer: payload.licenseIssuer,
        licenseYear: payload.licenseYear,
        licenseDoc: payload.licenseDoc,
        degreeTitle: payload.degreeTitle || prev.degreeTitle,
        degreeIssuer: payload.degreeIssuer || prev.degreeIssuer,
        degreeYear: payload.degreeYear || prev.degreeYear,
        degreeDoc: payload.degreeDoc || prev.degreeDoc,
        certificates: Array.isArray(updatedProfile?.certificates)
          ? updatedProfile.certificates
          : prev.certificates,
      }));
      setHasDoctorCredentials(true);
      await refreshSession();
      setIsEditCredentialsOpen(false);
      showToast("Doctor credentials updated in RTDB!");
    } catch (err) {
      setFormError(err.message || "Could not save credentials.");
    } finally {
      setSavingCredentials(false);
    }
  };

  // Family Member Management (reciprocal relationships in RTDB)
  const handleAddFamilyMember = async (e) => {
    if (e) e.preventDefault();
    setFamilyError("");
    const cleanUser = familyUsername.trim().replace(/^@/, "").toLowerCase();
    if (!cleanUser) {
      setFamilyError("Please enter a username to link.");
      return;
    }
    if (cleanUser === profile.username?.toLowerCase()) {
      setFamilyError("You cannot add yourself as a family member.");
      return;
    }
    setAddingFamily(true);
    try {
      const res = await authedFetch("/api/auth/user/family", {
        method: "POST",
        body: JSON.stringify({
          username: cleanUser,
          type: familyType,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to link family member.");
      }
      const updatedFamily = json.data?.family || {};
      setProfile((prev) => ({ ...prev, family: updatedFamily }));
      setFamilyUsername("");
      setIsAddFamilyOpen(false);
      showToast("Family member linked successfully!");
      await refreshSession();
    } catch (err) {
      setFamilyError(err.message || "Could not link family member.");
    } finally {
      setAddingFamily(false);
    }
  };

  const handleRemoveFamilyMember = async (targetUid) => {
    if (!targetUid) return;
    setRemovingFamilyId(targetUid);
    try {
      const res = await authedFetch(
        `/api/auth/user/family?targetUid=${targetUid}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove family member.");
      }
      const updatedFamily = json.data?.family || {};
      setProfile((prev) => ({ ...prev, family: updatedFamily }));
      showToast("Family member removed.");
      await refreshSession();
    } catch (err) {
      showToast(err.message || "Could not remove family member.");
    } finally {
      setRemovingFamilyId(null);
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setVitals((v) => ({ ...v, lastSynced: "Just now" }));
      showToast(
        isDoctor
          ? "Medical credentials synchronized with RTDB registry!"
          : "Synced telemetry from Apple Health & Fitbit Pro!",
      );
    }, 1000);
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
              {isDoctor ? (
                <Stethoscope className="size-5" />
              ) : (
                <Sparkles className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {isDoctor
                    ? "Doctor Clinical Profile"
                    : "Vitals & Health Profile"}
                </h1>
                <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:inline-flex">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {isDoctor ? "Doctor Portal" : "Live Sync"}
                </span>
              </div>
              <p className="text-xs text-muted">
                {isDoctor
                  ? "Medical certificates, clinical licensing, and doctor credentials"
                  : "Personal medical record, biometric telemetry, and account settings"}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShareProfile}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white"
              title="Share Public Profile"
            >
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">Share Profile</span>
              <span className="sm:hidden">Share</span>
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent sm:inline-flex"
            >
              <RefreshCw
                className={`size-3.5 text-primary ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>
                {isSyncing
                  ? "Syncing…"
                  : isDoctor
                    ? "Refresh Licensure"
                    : "Sync Vitals"}
              </span>
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
              <div
                className={`relative h-28 w-full bg-gradient-to-r ${
                  isDoctor
                    ? "from-blue-600/25 via-primary/25 to-indigo-600/25 dark:from-blue-900/40 dark:via-primary/20 dark:to-indigo-900/40"
                    : "from-cyan-500/20 via-primary/25 to-blue-600/20 dark:from-cyan-900/30 dark:via-primary/20 dark:to-blue-900/30"
                }`}
              >
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-md">
                    {isDoctor
                      ? `Doctor ID #${profile.uid ? profile.uid.slice(0, 8).toUpperCase() : "DR-771"}`
                      : `UID #${profile.uid ? profile.uid.slice(0, 8).toUpperCase() : "VT-USER"}`}
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
                  {isDoctor && !profile.name.toLowerCase().startsWith("dr")
                    ? `Dr. ${profile.name}`
                    : profile.name}
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

                {/* Tags */}
                <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
                  <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-accent-foreground capitalize">
                    {isDoctor ? "Licensed Doctor" : profile.type}
                  </span>
                  {profile.specialty && isDoctor && (
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {profile.specialty}
                    </span>
                  )}
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
                  {isDoctor ? (
                    profile.verified ? (
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Board Verified ✓
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Pending Review
                      </span>
                    )
                  ) : (
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
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
                  {isDoctor && profile.licenseNumber && (
                    <div className="flex items-center gap-2 border-t border-border/50 pt-1.5 text-foreground font-medium">
                      <FileCheck className="size-3.5 shrink-0 text-primary" />
                      <span>Lic: {profile.licenseNumber}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex w-full flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTempProfile(profile);
                      setFormError("");
                      setIsEditProfileOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    <Pencil className="size-3.5" />
                    Edit Profile Info
                  </button>

                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-accent hover:border-primary/40"
                  >
                    <Share2 className="size-3.5 text-primary" />
                    Share Public Profile
                  </button>
                </div>
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
                    {isDoctor
                      ? "Practice Emergency Contact"
                      : "Emergency Contact"}
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
                  {emergencyContact.name ? "Edit" : "+ Add"}
                </button>
              </div>

              {/* Emergency Contact Detail Row */}
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-background/60 p-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-500 shadow-sm">
                  <BriefcaseMedical className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-foreground">
                    {emergencyContact.name || "No emergency contact set"}
                  </h4>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {emergencyContact.relationship
                      ? `${emergencyContact.relationship} • `
                      : ""}
                    {emergencyContact.phone || "Click edit to add phone"}
                  </p>
                </div>
              </div>

              {emergencyContact.notes && (
                <p className="mt-2.5 text-xs text-muted">
                  Note: {emergencyContact.notes}
                </p>
              )}

              {emergencyContact.phone && (
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
                    onClick={() =>
                      showToast("Emergency SOS broadcast prepared.")
                    }
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white dark:text-rose-400"
                  >
                    ICE Alert
                  </button>
                </div>
              )}
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

          {/* ================= RIGHT COLUMN ================= */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* IF TYPE === DOCTOR: SHOW DOCTOR CERTIFICATES INSTEAD OF HEALTH VITALS */}
            {isDoctor ? (
              <div className="flex flex-col gap-4">
                {/* Section header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl flex items-center gap-2">
                      <Award className="size-5 text-primary" />
                      Doctor Credentials & Medical Certificates
                    </h3>
                    <p className="text-xs text-muted">
                      {hasDoctorCredentials
                        ? "Professional verification data from your registration — stored in Vitality RTDB"
                        : "Credentials are not configured yet • Showing reference examples below"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        hasDoctorCredentials
                          ? profile.verified
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted/20 text-muted border border-border"
                      }`}
                    >
                      {hasDoctorCredentials ? (
                        profile.verified ? (
                          <>
                            <CheckCircle2 className="size-3.5" />
                            Board Verified
                          </>
                        ) : (
                          <>
                            <Clock className="size-3.5 animate-pulse" />
                            Under Review
                          </>
                        )
                      ) : (
                        <>
                          <AlertCircle className="size-3.5" />
                          Not Submitted
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempCredentials({
                          specialty: profile.specialty || "",
                          licenseNumber: profile.licenseNumber || "",
                          licenseIssuer: profile.licenseIssuer || "",
                          licenseYear: profile.licenseYear || "",
                          licenseDoc: profile.licenseDoc || "",
                          degreeTitle: profile.degreeTitle || "",
                          degreeIssuer: profile.degreeIssuer || "",
                          degreeYear: profile.degreeYear || "",
                          degreeDoc: profile.degreeDoc || "",
                        });
                        setTempLicenseFile(null);
                        setTempDegreeFile(null);
                        setFormError("");
                        setIsEditCredentialsOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      {hasDoctorCredentials ? (
                        <>
                          <Pencil className="size-3.5" />
                          Edit Credentials
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          Enter Verification Details
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {hasDoctorCredentials ? (
                    <>
                      {/* REAL LICENSE CARD */}
                      <div
                        className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <FileCheck className="size-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  Medical License –{" "}
                                  {profile.specialty || "Specialty"}
                                </h4>
                                <p className="text-xs text-muted">
                                  {profile.licenseIssuer ||
                                    "Issuing Institution"}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                profile.licenseStatus === "approved" ||
                                profile.verified
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : profile.licenseStatus === "rejected"
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {profile.licenseStatus === "approved" ||
                              profile.verified
                                ? "Approved"
                                : profile.licenseStatus === "rejected"
                                  ? "Rejected"
                                  : "Under Review"}
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5 rounded-xl bg-background/50 p-3 text-xs text-muted">
                            <div className="flex justify-between">
                              <span>License No.:</span>
                              <span className="font-semibold text-foreground font-mono">
                                {profile.licenseNumber || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Issue Year:</span>
                              <span className="font-semibold text-foreground">
                                {profile.licenseYear || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Specialty:</span>
                              <span className="font-semibold text-foreground">
                                {profile.specialty || "—"}
                              </span>
                            </div>
                            {profile.licenseDoc && (
                              <div className="flex justify-between items-center gap-2">
                                <span>Document:</span>
                                <span className="truncate max-w-[150px] font-mono text-[11px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                                  {profile.licenseDoc}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                          <span className="text-[11px] text-muted">
                            License Credential
                          </span>
                          <span className="font-semibold text-primary">
                            {profile.licenseStatus === "approved" ||
                            profile.verified
                              ? "Verified Record"
                              : "Pending Approval"}
                          </span>
                        </div>
                      </div>

                      {/* REAL DEGREE CARD (or empty placeholder if not set) */}
                      {profile.degreeTitle ||
                      profile.degreeIssuer ||
                      profile.degreeYear ||
                      profile.degreeDoc ? (
                        <div
                          className={`flex flex-col justify-between p-5 ${GLASS_CARD}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  <GraduationCap className="size-6" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-foreground">
                                    {profile.degreeTitle || "Medical Degree"}
                                  </h4>
                                  <p className="text-xs text-muted">
                                    {profile.degreeIssuer ||
                                      "University / Institution"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  profile.degreeStatus === "approved" ||
                                  profile.verified
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : profile.degreeStatus === "rejected"
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {profile.degreeStatus === "approved" ||
                                profile.verified
                                  ? "Approved"
                                  : profile.degreeStatus === "rejected"
                                    ? "Rejected"
                                    : "Under Review"}
                              </span>
                            </div>

                            <div className="mt-4 space-y-1.5 rounded-xl bg-background/50 p-3 text-xs text-muted">
                              {profile.degreeYear && (
                                <div className="flex justify-between">
                                  <span>Graduation Year:</span>
                                  <span className="font-semibold text-foreground">
                                    {profile.degreeYear}
                                  </span>
                                </div>
                              )}
                              {profile.degreeIssuer && (
                                <div className="flex justify-between">
                                  <span>University:</span>
                                  <span className="font-semibold text-foreground">
                                    {profile.degreeIssuer}
                                  </span>
                                </div>
                              )}
                              {profile.degreeDoc && (
                                <div className="flex justify-between items-center gap-2">
                                  <span>Document:</span>
                                  <span className="truncate max-w-[150px] font-mono text-[11px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                                    {profile.degreeDoc}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                            <span className="text-[11px] text-muted">
                              Academic Credential
                            </span>
                            <span className="font-semibold text-primary">
                              {profile.degreeStatus === "approved" ||
                              profile.verified
                                ? "Verified Record"
                                : "Pending Approval"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex flex-col items-center justify-center p-6 text-center ${GLASS_CARD} border-dashed opacity-75`}
                        >
                          <GraduationCap className="size-10 text-muted mb-2" />
                          <p className="text-sm font-semibold text-foreground">
                            No Degree Document on File
                          </p>
                          <p className="text-xs text-muted mt-1 max-w-[220px]">
                            Medical degree or diploma is optional. You can add
                            it anytime via Edit Credentials.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* REFERENCE EXAMPLE 1: Medical Practice License */}
                      <div
                        className={`flex flex-col justify-between p-5 ${GLASS_CARD} relative overflow-hidden border-dashed`}
                      >
                        <div className="absolute right-3 top-3">
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Reference Example
                          </span>
                        </div>
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <FileCheck className="size-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                Medical Practice License (Example)
                              </h4>
                              <p className="text-xs text-muted">
                                State Medical Licensing Authority
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5 rounded-xl bg-background/50 p-3 text-xs text-muted">
                            <div className="flex justify-between">
                              <span>License No.:</span>
                              <span className="font-semibold text-foreground font-mono">
                                MD-984201
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Issue Year:</span>
                              <span className="font-semibold text-foreground">
                                2021
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Specialty:</span>
                              <span className="font-semibold text-foreground">
                                Cardiology
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sample Doc:</span>
                              <span className="font-mono text-[11px] text-primary">
                                medical_license_sample.pdf
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                          <span className="text-[11px] text-muted">
                            License Credential
                          </span>
                          <span className="font-semibold text-amber-500">
                            Action Required
                          </span>
                        </div>
                      </div>

                      {/* REFERENCE EXAMPLE 2: Medical Degree */}
                      <div
                        className={`flex flex-col justify-between p-5 ${GLASS_CARD} relative overflow-hidden border-dashed`}
                      >
                        <div className="absolute right-3 top-3">
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Reference Example
                          </span>
                        </div>
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <GraduationCap className="size-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                Doctor of Medicine (M.D.) (Example)
                              </h4>
                              <p className="text-xs text-muted">
                                Faculty of Medicine & Surgery
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5 rounded-xl bg-background/50 p-3 text-xs text-muted">
                            <div className="flex justify-between">
                              <span>Degree Title:</span>
                              <span className="font-semibold text-foreground">
                                Bachelor of Medicine & Surgery (MBBCh)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Graduation Year:</span>
                              <span className="font-semibold text-foreground">
                                2018
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Sample Diploma:</span>
                              <span className="font-mono text-[11px] text-primary">
                                medical_degree_sample.pdf
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                          <span className="text-[11px] text-muted">
                            Academic Credential
                          </span>
                          <span className="font-semibold text-amber-500">
                            Action Required
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* IF TYPE === USER: HEALTH METRICS / VITALS SECTION */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                      Health Metrics & Vitals
                    </h3>
                    <p className="text-xs text-muted">
                      {hasVitals
                        ? `Continuous biometric stream • Synced ${vitals.lastSynced || "Today"}`
                        : "Vitals are not configured yet • Showing reference examples below"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempVitals({
                        height: vitals.height || 172,
                        weight: vitals.weight || 64.5,
                        bloodType: vitals.bloodType || "A+",
                        bloodRh: vitals.bloodRh || "POS",
                      });
                      setFormError("");
                      setIsEditVitalsOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <Pencil className="size-3" />
                    {hasVitals ? "Update Vitals" : "Enter Your Vitals"}
                  </button>
                </div>

                {/* Banner when vitals are not set yet */}
                {!hasVitals && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
                    <AlertCircle className="size-4 shrink-0 text-primary" />
                    <span>
                      <strong>Notice:</strong> Your vitals are currently empty.
                      The figures below are examples for reference. Click{" "}
                      <strong>&quot;Enter Your Vitals&quot;</strong> to log your
                      measurements.
                    </span>
                  </div>
                )}

                {/* 3 Metric Cards (HEIGHT, WEIGHT, BLOOD TYPE) */}
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
                      {hasVitals ? (
                        <>
                          <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                            {vitals.height}
                          </span>
                          <span className="text-sm font-semibold text-muted">
                            cm
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-3xl font-extrabold tracking-tight text-muted/60">
                            —
                          </span>
                          <span className="mt-1 text-[11px] font-semibold text-primary">
                            e.g. 172 cm (5&apos;8&quot;)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                      <span>
                        {hasVitals ? `${feet}' ${inches}"` : "Not set yet"}
                      </span>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        {hasVitals ? "Adult Standard" : "Click to enter"}
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
                      {hasVitals ? (
                        <>
                          <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                            {vitals.weight}
                          </span>
                          <span className="text-sm font-semibold text-muted">
                            kg
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-3xl font-extrabold tracking-tight text-muted/60">
                            —
                          </span>
                          <span className="mt-1 text-[11px] font-semibold text-primary">
                            e.g. 64.5 kg (142 lbs)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                      <span>
                        {hasVitals ? `${weightLbs} lbs` : "Not set yet"}
                      </span>
                      {hasVitals ? (
                        <span className={`font-semibold ${bmiStatus.color}`}>
                          BMI {bmi}
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Auto-BMI
                        </span>
                      )}
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
                      {hasVitals ? (
                        <>
                          <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                            {vitals.bloodType}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                            {vitals.bloodRh}
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-3xl font-extrabold tracking-tight text-muted/60">
                            —
                          </span>
                          <span className="mt-1 text-[11px] font-semibold text-primary">
                            e.g. A+ POS
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted">
                      <span>
                        {hasVitals
                          ? `Rh ${vitals.bloodRh === "POS" ? "Positive" : "Negative"}`
                          : "Not set yet"}
                      </span>
                      <span className="font-medium text-foreground">
                        {hasVitals ? "Donor Match" : "Click to select"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAMILY MEMBERS SECTION */}
            {!isDoctor && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl flex items-center gap-2">
                      <Users className="size-5 text-primary" />
                      Family Members
                    </h3>
                    <p className="text-xs text-muted">
                      Connected family health records & reciprocal relationships
                      in RTDB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyUsername("");
                      setFamilyType("parent");
                      setFamilyError("");
                      setIsAddFamilyOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <UserPlus className="size-3.5" />
                    Add Member
                  </button>
                </div>

                {/* Family Members Grid / Empty State */}
                {profile.family && Object.keys(profile.family).length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.values(profile.family).map((member) => {
                      const relMeta = RELATIONSHIP_LABELS[member.type] || {
                        label: member.type || "Family",
                        color: "bg-primary/10 text-primary border-primary/20",
                      };
                      return (
                        <div
                          key={member.id || member.username}
                          className={`flex flex-col justify-between p-4.5 ${GLASS_CARD}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
                                {member.name?.[0]?.toUpperCase() || (
                                  <User className="size-5" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-foreground">
                                  {member.name || "Family Member"}
                                </h4>
                                <p className="text-xs text-muted font-mono">
                                  @{member.username}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border capitalize ${relMeta.color}`}
                            >
                              {relMeta.label}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                            <span className="text-[11px] text-muted">
                              Linked{" "}
                              {member.createdAt
                                ? formatMemberDate(member.createdAt)
                                : "Recently"}
                            </span>
                            <button
                              type="button"
                              disabled={removingFamilyId === member.id}
                              onClick={() =>
                                handleRemoveFamilyMember(member.id)
                              }
                              className="font-semibold text-rose-500 hover:text-rose-600 transition text-[11px] disabled:opacity-50"
                            >
                              {removingFamilyId === member.id
                                ? "Removing…"
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center p-6 text-center ${GLASS_CARD} border-dashed`}
                  >
                    <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary mb-2">
                      <Users className="size-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      No Family Members Linked
                    </p>
                    <p className="text-xs text-muted mt-1 max-w-[280px]">
                      Connect parents, children, spouse, or siblings to
                      coordinate care and emergency access.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFamilyUsername("");
                        setFamilyType("parent");
                        setFamilyError("");
                        setIsAddFamilyOpen(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <UserPlus className="size-3.5" />
                      Link First Member
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. SECURITY & PREFERENCES SECTION */}
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

            {/* 3. ACTIVE INTEGRATIONS SECTION */}
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
                  placeholder="e.g. 172"
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
                  placeholder="e.g. 64.5"
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

              {/* Account Role / Type */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="profile-type"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Account Role
                </label>
                <select
                  id="profile-type"
                  value={tempProfile.type}
                  onChange={(e) =>
                    setTempProfile({
                      ...tempProfile,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary capitalize"
                >
                  <option value="user">Patient / User</option>
                  <option value="doctor">Medical Doctor</option>
                </select>
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

              {/* Family Relationships Section (RTDB reciprocal links) */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Family Relationships
                    </span>
                  </div>
                  <span className="text-[11px] text-muted font-medium">
                    {profile.family ? Object.keys(profile.family).length : 0}{" "}
                    Linked
                  </span>
                </div>

                {/* Current Family Members List */}
                {profile.family && Object.keys(profile.family).length > 0 && (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {Object.values(profile.family).map((member) => {
                      const relMeta = RELATIONSHIP_LABELS[member.type] || {
                        label: member.type || "Family",
                        color: "bg-primary/10 text-primary border-primary/20",
                      };
                      return (
                        <div
                          key={member.id || member.username}
                          className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-foreground truncate max-w-[130px]">
                              {member.name}
                            </span>
                            <span className="text-muted font-mono text-[11px]">
                              @{member.username}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border capitalize ${relMeta.color}`}
                            >
                              {relMeta.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={removingFamilyId === member.id}
                            onClick={() => handleRemoveFamilyMember(member.id)}
                            className="text-muted hover:text-rose-500 p-1 transition disabled:opacity-50"
                            title="Remove family member"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Family Member Form */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-semibold text-muted">
                    Link Family Member by Username
                  </span>
                  {familyError && (
                    <p className="text-xs text-rose-500 font-medium">
                      {familyError}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="sm:col-span-2 relative flex items-center">
                      <span className="absolute left-3 text-xs text-muted font-semibold">
                        @
                      </span>
                      <input
                        type="text"
                        value={familyUsername}
                        onChange={(e) =>
                          setFamilyUsername(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        placeholder="username"
                        className="w-full rounded-xl border border-border bg-surface pl-7 pr-3 py-2 text-xs text-foreground outline-none transition focus:border-primary"
                      />
                    </div>
                    <select
                      value={familyType}
                      onChange={(e) => setFamilyType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none transition focus:border-primary capitalize"
                    >
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="spouse">Spouse</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="grandchild">Grandchild</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={addingFamily || !familyUsername.trim()}
                      onClick={handleAddFamilyMember}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                    >
                      <UserPlus className="size-3.5" />
                      {addingFamily ? "Linking…" : "Link Member"}
                    </button>
                  </div>
                </div>
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

      {/* ================= ADD FAMILY MEMBER MODAL ================= */}
      {isAddFamilyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-family-title"
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </div>
                <h3
                  id="add-family-title"
                  className="text-base font-bold text-foreground"
                >
                  Link Family Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFamilyOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddFamilyMember}
              className="mt-4 flex flex-col gap-4"
            >
              <p className="text-xs text-muted leading-relaxed">
                Enter the username of your family member. A reciprocal
                relationship will be created automatically in Realtime Database.
              </p>

              {familyError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{familyError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="family-username-modal"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Family Member Username *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm text-muted font-semibold">
                    @
                  </span>
                  <input
                    id="family-username-modal"
                    type="text"
                    required
                    value={familyUsername}
                    onChange={(e) =>
                      setFamilyUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    placeholder="username"
                    className="w-full rounded-xl border border-border bg-background pl-8 pr-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="family-relation-modal"
                  className="text-xs font-semibold text-muted uppercase"
                >
                  Relationship to You *
                </label>
                <select
                  id="family-relation-modal"
                  value={familyType}
                  onChange={(e) => setFamilyType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary capitalize"
                >
                  <option value="parent">Parent (They see you as Child)</option>
                  <option value="child">Child (They see you as Parent)</option>
                  <option value="sibling">Sibling (Reciprocal)</option>
                  <option value="spouse">Spouse (Reciprocal)</option>
                  <option value="grandparent">
                    Grandparent (They see you as Grandchild)
                  </option>
                  <option value="grandchild">
                    Grandchild (They see you as Grandparent)
                  </option>
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddFamilyOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingFamily || !familyUsername.trim()}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {addingFamily ? "Linking…" : "Link Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SHARE PROFILE MODAL ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Share2 className="size-4" aria-hidden="true" />
                </div>
                <h3
                  id="share-modal-title"
                  className="text-base font-bold text-foreground"
                >
                  Share Public Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                aria-label="Close share dialog"
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <p className="text-xs leading-relaxed text-muted">
                Anyone with this link can view your profile on Vitality —
                whether they have signed up or not. The page is SEO-optimized
                and verified with live data.
              </p>

              {/* Link Box */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                <div className="flex flex-1 items-center gap-2 overflow-hidden px-2">
                  <Link2
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="truncate font-mono text-xs text-foreground">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}${publicProfilePath}`
                      : publicProfilePath}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  aria-label="Copy public profile link"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:opacity-90 active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="size-3.5" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2.5 pt-2 sm:flex-row">
                <Link
                  href={publicProfilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
                >
                  <ExternalLink
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  Preview Public Profile
                </Link>

                {typeof navigator !== "undefined" && navigator.share && (
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}${publicProfilePath}`;
                      navigator
                        .share({
                          title: isDoctor
                            ? `Dr. ${profile.name}'s Medical Profile | Vitality`
                            : `${profile.name}'s Health Profile | Vitality`,
                          text: `View ${profile.name}'s verified profile on Vitality Health:`,
                          url: fullUrl,
                        })
                        .catch(() => {});
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white sm:w-auto"
                  >
                    <Share2 className="size-3.5" aria-hidden="true" />
                    Share via Device
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT CREDENTIALS MODAL (DOCTOR ONLY) ================= */}
      {isEditCredentialsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cred-modal-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Award className="size-4" aria-hidden="true" />
                </div>
                <h3
                  id="cred-modal-title"
                  className="text-base font-bold text-foreground"
                >
                  {hasDoctorCredentials
                    ? "Edit Professional Credentials"
                    : "Enter Professional Verification"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditCredentialsOpen(false)}
                aria-label="Close credentials dialog"
                className="rounded-lg p-1 text-muted hover:bg-accent hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCredentials}
              className="mt-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1"
            >
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── Required License Section ─────────────────────────────────── */}
              <div className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-background/40">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="size-4 text-primary" />
                  Medical License (Required)
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-specialty"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      Medical Specialty *
                    </label>
                    <input
                      id="cred-specialty"
                      type="text"
                      required
                      minLength={2}
                      value={tempCredentials.specialty}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          specialty: e.target.value,
                        })
                      }
                      placeholder="e.g. Cardiology"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-licnum"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      License Number *
                    </label>
                    <input
                      id="cred-licnum"
                      type="text"
                      required
                      minLength={3}
                      value={tempCredentials.licenseNumber}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          licenseNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. MD-984201"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-licissuer"
                      className="text-xs font-semibold text-muted uppercase flex items-center gap-1"
                    >
                      <Building2 className="size-3.5 text-primary" />
                      Issuing Institution *
                    </label>
                    <input
                      id="cred-licissuer"
                      type="text"
                      required
                      minLength={2}
                      value={tempCredentials.licenseIssuer}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          licenseIssuer: e.target.value,
                        })
                      }
                      placeholder="e.g. State Medical Board"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-licyear"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      Issue Year *
                    </label>
                    <input
                      id="cred-licyear"
                      type="number"
                      required
                      min={1950}
                      max={new Date().getFullYear()}
                      value={tempCredentials.licenseYear}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          licenseYear: e.target.value,
                        })
                      }
                      placeholder={String(new Date().getFullYear())}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                </div>

                <FileDropZone
                  label="License Document"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  hint="PDF, JPG, or PNG — max 10 MB"
                  currentFileName={tempCredentials.licenseDoc}
                  file={tempLicenseFile}
                  onFileChange={(f) => setTempLicenseFile(f)}
                />
              </div>

              {/* ── Optional Degree Section ──────────────────────────────────── */}
              <div className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-background/40">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-indigo-500" />
                  Medical Degree / Diploma (Optional)
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-degreetitle"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      Degree Title
                    </label>
                    <input
                      id="cred-degreetitle"
                      type="text"
                      value={tempCredentials.degreeTitle}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          degreeTitle: e.target.value,
                        })
                      }
                      placeholder="e.g. Bachelor of Medicine & Surgery (MBBCh)"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="cred-degreeissuer"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      University / Institution
                    </label>
                    <input
                      id="cred-degreeissuer"
                      type="text"
                      value={tempCredentials.degreeIssuer}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          degreeIssuer: e.target.value,
                        })
                      }
                      placeholder="e.g. Cairo University"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label
                      htmlFor="cred-degreeyear"
                      className="text-xs font-semibold text-muted uppercase"
                    >
                      Graduation Year
                    </label>
                    <input
                      id="cred-degreeyear"
                      type="number"
                      min={1950}
                      max={new Date().getFullYear()}
                      value={tempCredentials.degreeYear}
                      onChange={(e) =>
                        setTempCredentials({
                          ...tempCredentials,
                          degreeYear: e.target.value,
                        })
                      }
                      placeholder="e.g. 2018"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </div>
                </div>

                <FileDropZone
                  label="Degree Document"
                  accept=".pdf,.jpg,.jpeg,.png"
                  hint="PDF, JPG, or PNG — max 10 MB"
                  currentFileName={tempCredentials.degreeDoc}
                  file={tempDegreeFile}
                  onFileChange={(f) => setTempDegreeFile(f)}
                />
              </div>

              <div className="mt-2 flex justify-end gap-2.5 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditCredentialsOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCredentials}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingCredentials
                    ? "Saving to RTDB…"
                    : hasDoctorCredentials
                      ? "Save Credentials"
                      : "Submit Verification"}
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
