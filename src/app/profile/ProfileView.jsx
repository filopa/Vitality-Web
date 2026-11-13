"use client";

import {
  Activity,
  AlertCircle,
  Award,
  Bell,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
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
  Ruler,
  Scale,
  Share2,
  ShieldCheck,
  Upload,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import BottomNav from "@/app/_components/dashboard/BottomNav";

import { useApp } from "@/lib/AppProvider";
import { authedFetch } from "@/lib/client/api";
import { auth, ensureFirebaseAuthPersistence, rtdb } from "@/lib/firebase";
import { EditProfileForm } from "../_components/profile/EditProfileForm";
import DashboardHeader from "../_components/dashboard/DashboardHeader";
import { uploadToStorage } from "@/lib/client/upload";
import { onValue, push, ref, update } from "firebase/database";
import { EditVitals } from "../_components/profile/EditVitals";
import { UserSearchBox } from "../_components/users/UserSearchBox";
import { getUsersByIds } from "@/lib/client/users";
const GLASS_CARD =
  "rounded-2xl border border-border/70 bg-surface/90 text-surface-foreground shadow-[0_4px_16px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all hover:border-border hover:shadow-[0_6px_24px_rgba(15,23,42,0.07)]";

// Compress client uploaded image to lightweight WebP data URL

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
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${dragging
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
  const { user, userData, refreshUserData } = useApp();
  const fileInputRef = useRef(null);

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
    avatarURL:
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



  const [hasDoctorCredentials, setHasDoctorCredentials] = useState(
    Boolean(
      userData?.licenseNumber &&
      (userData?.licenseIssuer ||
        userData?.specialty ||
        userData?.licenseDoc),
    ),
  );

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
  const [percent, setPercent] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savingEmergency, setSavingEmergency] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [addingFamily, setAddingFamily] = useState(false);
  const [removingFamilyId, setRemovingFamilyId] = useState(null);
  const [familyArr, setFamilyArr] = useState([]);
  const [familyType, setFamilyType] = useState([]);
  const [familyError, setFamilyError] = useState("");
  const [followersDialog, setFollowersDialog] = useState(false);
  const [followingDialog, setFollowingDialog] = useState(false);
  const [followers, setFollowers] = useState({});
  const [following, setFollowing] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [formError, setFormError] = useState("");
  const followerCount = Object.keys(followers).length;
  const followingCount = Object.keys(following).length;
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
  const [followersData, setFollowersData] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [tempLicenseFile, setTempLicenseFile] = useState(null);
  const [tempDegreeFile, setTempDegreeFile] = useState(null);
  const [selected, setSelected] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };
  useEffect(() => {
    let active = true;
    let unsubscribeAuth = () => { };
    let unsubscribeUser = () => { };
    let unsubscribeFollowers = () => { };
    let unsubscribeFollowing = () => { };
    let unsubscribeFamily = () => { };
    ensureFirebaseAuthPersistence()
      .then(() => {
        if (!active) return;

        unsubscribeAuth = onAuthStateChanged(
          auth,
          (firebaseUser) => {
            unsubscribeUser();
            unsubscribeFollowers();
            unsubscribeFollowing();
            unsubscribeUser = () => { };
            unsubscribeFollowers = () => { };
            unsubscribeFollowing = () => { };
            unsubscribeFamily = () => { };

            setFollowers({});
            setFollowing({});
            setFamilyArr({});

            unsubscribeFollowers = onValue(
              ref(rtdb, `followers/${firebaseUser.uid}`),
              (snapshot) => {
                if (active && auth.currentUser?.uid === firebaseUser.uid) {
                  setFollowers(snapshot.val() ?? {});
                }
              },
              (error) => {
                console.error("Firebase followers subscription failed:", error);
              },
            );

            unsubscribeFollowing = onValue(
              ref(rtdb, `following/${firebaseUser.uid}`),
              (snapshot) => {
                if (active && auth.currentUser?.uid === firebaseUser.uid) {
                  setFollowing(snapshot.val() ?? {});
                }
              },
              (error) => {
                console.error("Firebase following subscription failed:", error);
              },
            );
            
            unsubscribeFamily = onValue(
              ref(rtdb, `family/${firebaseUser.uid}`),
              (snapshot) => {
                if (active && auth.currentUser?.uid === firebaseUser.uid) {
                  setFamilyArr(snapshot.val() ?? {});
                }
              },
              (error) => {
                console.error("Firebase family subscription failed:", error);
              },
            );

          },
          (error) => {
            console.error("Firebase Auth state subscription failed:", error);
            if (active) ;
          },
        );
      })
      .catch((error) => {
        console.error("Firebase Auth persistence initialization failed:", error);
        if (active) ;
      });

    return () => {
      active = false;
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, []);

  useEffect(() => {
    if (!userData) return;
    const vitals = onValue(ref(rtdb, `records/${userData.uid}/vitals`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVitals({
          height: data.height || "",
          weight: data.weight || "",
          bloodType: data.bloodType || "O",
          bloodRh: data.bloodRh || "POS",
        });
      }
    });

    setHasDoctorCredentials(
      Boolean(
        userData.licenseNumber &&
        (userData.licenseIssuer ||
          userData.specialty ||
          userData.licenseDoc),
      ),
    );
    setProfile({
      uid: userData.uid || "",
      name: userData.name || "User",
      username: userData.username || "",
      email: userData.email || "",
      phone: userData.phone || "",
      country: userData.country || "",
      gender: userData.gender || "",
      birthday: userData.birthday || "",
      bio: userData.bio || "",
      type: userData.type || "user",
      specialty: userData.specialty || "",
      licenseNumber: userData.licenseNumber || "",
      licenseIssuer: userData.licenseIssuer || "",
      licenseYear: userData.licenseYear || "",
      licenseDoc: userData.licenseDoc || "",
      licenseStatus: userData.licenseStatus || "padding",
      degreeTitle: userData.degreeTitle || "",
      degreeIssuer: userData.degreeIssuer || "",
      degreeYear: userData.degreeYear || "",
      degreeDoc: userData.degreeDoc || "",
      degreeStatus: userData.degreeStatus || "padding",
      verified: userData.verified || false,
      certificates: Array.isArray(userData.certificates)
        ? userData.certificates
        : [],
      avatarURL:
        userData.urlProfile ||
        userData.photoURL ||
        userData.avatarURL ||
        userData.urlAvatar ||
        user?.photoURL ||
        "",
      memberSince:
        formatMemberDate(userData.createdAt) ||
        formatMemberDate(user?.metadata?.creationTime) ||
        "",
    });
    setEmergencyContact(
      userData.emergencyContact ?? {
        name: "",
        relationship: "",
        phone: "",
        notes: "",
      },
    );
    return () => vitals();
  }, [userData, user]);

  useEffect(() => {
    if (followersDialog) {
      const loadFollowers = async () => {
        setFollowersLoading(true);

        try {
          const people = await getUsersByIds(Object.keys(followers || {}));

          console.log("people", people);

          setFollowersData(
            Array.from(people.values())
          );
        } catch (error) {
          console.error("Failed to load followers:", error);
          setFollowersData([]);
        } finally {
          setFollowersLoading(false);
        }
      };
      loadFollowers();
    }
    if (followingDialog) {
      const loadFollowing = async () => {
        setFollowersLoading(true);

        try {
          const people = await getUsersByIds(Object.keys(following || {}));

          console.log("people", people);

          setFollowersData(
            Array.from(people.values())
          );
        } catch (error) {
          console.error("Failed to load following:", error);
          setFollowersData([]);
        } finally {
          setFollowersLoading(false);
        }
      };


      loadFollowing();
    }

  }, [followersDialog, followingDialog, followers, following]);
  const isDoctor = profile.type === "doctor";

  // BMI calculation (uses real values if saved, else example 172cm / 64.5kg)
  const displayHeight = vitals ? vitals.height : 172;
  const displayWeight = vitals ? vitals.weight : 64.5;
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
  const postCount = Number(userData?.postsCount);
  const profileStats = [
    { label: "posts", value: Number.isFinite(postCount) ? postCount : 0 },
    { label: "following", value: followingCount },
    { label: "followers", value: followerCount },
  ];

  // ── Handlers ─────────────────────────────────────────────────────────────

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
      await refreshUserData();
      setIsEditEmergencyOpen(false);
      showToast("Emergency contact saved to database!");
    } catch (err) {
      setFormError(err.message || "Could not save emergency contact.");
    } finally {
      setSavingEmergency(false);
    }
  };

  // Photo Upload Handler (Device file upload)

  async function convertImageToWebp(img, maxDimension, quality) {
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create canvas context");
    }

    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert image to WebP"));
            return;
          }

          resolve(blob);
        },
        "image/webp",
        quality
      );
    });
  }


  async function convertImageToTwoWebpVariants(file) {
    const imageUrl = URL.createObjectURL(file);

    try {
      const img = new window.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const [mainBlob, thumbBlob] = await Promise.all([
        convertImageToWebp(img, 1200, 0.85),
        convertImageToWebp(img, 400, 0.75),
      ]);

      const baseName = file.name.replace(/\.[^/.]+$/, "");

      const mainWebp = new File(
        [mainBlob],
        `${baseName}_main.webp`,
        {
          type: "image/webp",
        }
      );

      const thumbWebp = new File(
        [thumbBlob],
        `${baseName}_thumb.webp`,
        {
          type: "image/webp",
        }
      );

      return {
        mainWebp,
        thumbWebp,
      };
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }


  async function handleChangeProfilePhoto(
    originalFile,
    setPercent,
  ) {
    try {
      setPercent?.(5);

      const { mainWebp, thumbWebp } =
        await convertImageToTwoWebpVariants(originalFile);

      setPercent?.(10);

      const mainUploadResult = await uploadToStorage({
        kind: "profile-photo",
        file: mainWebp,

        onProgress: (progress) => {
          setPercent?.(10 + progress * 0.7);
        },
      });

      const mainUrl =
        mainUploadResult?.url || mainUploadResult;

      const thumbUploadResult = await uploadToStorage({
        kind: "profile-photo",
        file: thumbWebp,

        onProgress: (progress) => {
          setPercent?.(80 + progress * 0.2);
        },
      });

      const thumbUrl =
        thumbUploadResult?.url || thumbUploadResult;

      setPercent?.(100);

      const profileDataToSave = {
        avatarURL: mainUrl.publicUrl,
        photoURL: thumbUrl.publicUrl,
      };

      if (profileDataToSave) {
        const refdb = ref(rtdb, `users/${userData.uid}/`);
        await update(refdb, profileDataToSave);
      }

      return {
        mainUrl,
        thumbUrl,
      };

    } catch (error) {
      console.error("Failed to change profile photo:", error);
      throw error;
    }
  }
  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      await handleChangeProfilePhoto(
        file,
        setPercent,
      );
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
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
      await refreshUserData();
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

    if (!selected || selected.length === 0) return;

    setFamilyError("");
    setAddingFamily(true);

    try {
      const updates = {};

      const reverseRelationship = {
        parent: "child",
        child: "parent",
        sibling: "sibling",
        spouse: "spouse",
        grandparent: "grandchild",
        grandchild: "grandparent",
      };

      const now = Date.now();

      for (const item of selected) {
        const uid = item.user?.uid;

        const type = familyType.find(
          (relation) => relation.uid === uid
        )?.type;

        if (!uid || !type) {
          console.warn("Invalid selected item:", item);
          continue;
        }

        const recipientRelationship =
          reverseRelationship[type] || "family member";

        updates[`family/${userData.uid}/${uid}`] = {
          addedAt: now,
          type,
          id: uid,
          accepted: false,
        };

        const notificationKey = push(
          ref(rtdb, `notifications/${uid}`)
        ).key;

        updates[`notifications/${uid}/${notificationKey}`] = {
          type: "familyLink",
          from: userData.uid,
          id: notificationKey,
          createdAt: now,
          title: `${userData.name} sent you a family link request`,
          message: `${userData.name} sent you a request to be your ${recipientRelationship}.`,
          read: false,
        };
      }

      await update(ref(rtdb), updates);
      setSelected([]);
      setIsAddFamilyOpen(false);

      showToast("Family member linked successfully!");
      await refreshUserData();

    } catch (err) {
      console.error("Failed to link family member:", err);

      setFamilyError(
        err.message || "Could not link family member."
      );

    } finally {
      setAddingFamily(false);
    }
  };

  const handleRemoveFamilyMember = async (targetUid) => {
    if (!targetUid) return;
    setRemovingFamilyId(targetUid);
    try {

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to remove family member.");
      }
      const updatedFamily = json.data?.family || {};
      setProfile((prev) => ({ ...prev, family: updatedFamily }));
      showToast("Family member removed.");
      await refreshUserData();
    } catch (err) {
      showToast(err.message || "Could not remove family member.");
    } finally {
      setRemovingFamilyId(null);
    }
  };

  const handleManualSync = () => {
    setTimeout(() => {
      setVitals((v) => ({ ...v, lastSynced: "Just now" }));
      showToast(
        isDoctor
          ? "Medical credentials synchronized with RTDB registry!"
          : "Synced telemetry from Apple Health & Fitbit Pro!",
      );
    }, 1000);
  };

  const compactNumber = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.assign("/login");
    } catch (error) {
      console.error("Firebase sign-out failed:", error);
      showToast("We couldn't sign you out. Please try again.");
    }
  };

  return (
    <div className="min-h-dvh bg-background font-brand text-foreground antialiased lg:pl-24">

      <DashboardHeader />

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

          <div className={`min-w-0 w-full p-5 ${GLASS_CARD} lg:col-span-4`}>
            {/* Username */}
            <div className="mb-4 flex items-center gap-1.5">
              <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
                {profile.username || profile.name}
              </h2>
              {isDoctor && profile.verified && (
                <span
                  title="Verified doctor"
                  aria-label="Verified doctor"
                  className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >
                  ✓
                </span>
              )}
            </div>

            {/* Avatar + stats */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                {/* Story-style gradient ring */}
                <div className="rounded-full bg-gradient-to-r from-cyan-500 via-primary to-blue-600 dark:from-cyan-900 dark:via-primary dark:to-blue-900 p-[3px]">
                  <div className="relative size-20 overflow-hidden rounded-full border-[3px] border-surface bg-surface sm:size-24">
                    {profile.avatarURL ? (
                      <Image
                        src={profile.avatarURL}
                        alt={profile.name}
                        fill
                        sizes="96px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-primary/20 text-2xl font-bold text-primary">
                        {profile.name?.[0]?.toUpperCase() || <User className="size-8" />}
                      </div>
                    )}
                    {percent && Number(percent) < 100 && (
                      <div className="absolute inset-0 grid place-items-center rounded-full overflow-hidden">
                        {/* Water */}
                        <div
                          className="absolute bottom-0 left-0 w-full bg-primary/80 transition-all duration-700 ease-in-out"
                          style={{ height: `${Number(percent)}%` }}
                        >
                          {/* Animated waves */}
                          <div className="absolute -top-2 left-0 w-[200%] h-4 animate-wave">
                            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                              <path
                                d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
                                fill="currentColor"
                                className="text-primary"
                              />
                            </svg>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                        </div>

                        {/* Percentage */}
                        <span className="relative z-10 text-xs font-medium text-primary-foreground drop-shadow">
                          {Math.round(Number(percent))}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change Photo"
                  title="Change Photo"
                  disabled={Number(percent) != "100" && percent}
                  className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground shadow-md transition hover:scale-110 active:scale-95"
                >
                  <Camera className="size-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePhotoChange}
                />
              </div>

              <ul className="flex flex-1 justify-around text-center">
                {profileStats.map(({ label, value }) => (

                  <li key={label}>
                    <button onClick={() => label === "followers" ? setFollowersDialog(true) : label === "following" ? setFollowingDialog(true) : ""} className="flex flex-col items-center cursor-pointer gap-0.5 rounded-lg px-2 py-1 transition hover:bg-foreground/5">
                      <span className="text-base font-bold leading-tight text-foreground sm:text-lg">
                        {compactNumber.format(value)}
                      </span>
                      <span className="text-xs text-muted">{label}</span>
                    </button>
                  </li>
                ))}

              </ul>
            </div>
            {/* Name, category, bio */}
            <div className="mt-4 flex flex-col gap-0.5">
              <p className="text-sm font-bold text-foreground">
                {isDoctor && !profile.name.toLowerCase().startsWith("dr")
                  ? `Dr. ${profile.name}`
                  : profile.name}
              </p>
              <p className="text-xs capitalize text-muted">
                {[isDoctor ? "Licensed Doctor" : profile.type, isDoctor && profile.specialty]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              {profile.bio && (
                <p className="mt-1 text-sm leading-snug text-foreground">{profile.bio}</p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Calendar className="size-3.5 text-primary" />
                Member since {profile.memberSince}
              </p>
            </div>

            {/* Status chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
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
              {profile.gender && (
                <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold capitalize text-accent-foreground">
                  {profile.gender}
                </span>
              )}
              {userAge !== null && (
                <span className="rounded-md bg-accent/60 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  {userAge} yrs
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {

                  setFormError("");
                  setIsEditProfileOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground/5 py-2 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
              >
                <Pencil className="size-3.5" />
                Edit profile
              </button>

              <button
                type="button"
                onClick={handleShareProfile}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground/5 py-2 text-sm font-semibold text-foreground transition hover:bg-foreground/10"
              >
                <Share2 className="size-3.5" />
                Share profile
              </button>
            </div>

            {/* Contact & Location Details */}
            <div className="mt-4 flex w-full flex-col gap-2 rounded-xl border border-border/50 bg-background/50 p-3 text-left text-xs text-muted">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate font-medium text-foreground">
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
                <span className="font-medium text-foreground">
                  {profile.phone || "No phone added"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                <span>{profile.country || "Country not set"}</span>
              </div>
              {isDoctor && profile.licenseNumber && (
                <div className="flex items-center gap-2 border-t border-border/50 pt-1.5 font-medium text-foreground">
                  <FileCheck className="size-3.5 shrink-0 text-primary" />
                  <span>Lic: {profile.licenseNumber}</span>
                </div>
              )}
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
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${hasDoctorCredentials
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
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${profile.licenseStatus === "approved" ||
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
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${profile.degreeStatus === "approved" ||
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
                      {vitals.height && vitals.weight && vitals.bloodType
                        ? `Continuous biometric stream • Synced ${vitals.lastSynced || "Today"}`
                        : "Vitals are not configured yet • Showing reference examples below"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditVitalsOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <Pencil className="size-3" />
                    {vitals.height && vitals.weight && vitals.bloodType ? "Update Vitals" : "Enter Your Vitals"}
                  </button>
                </div>

                {/* Banner when vitals are not set yet */}
                {!vitals.height && !vitals.weight && !vitals.bloodType && (
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
                      {vitals.height ? (
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
                        {vitals ? `${feet}' ${inches}"` : "Not set yet"}
                      </span>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        {vitals ? "Adult Standard" : "Click to enter"}
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
                      {vitals.weight ? (
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
                        {vitals.weight && vitals.height ? `${weightLbs} lbs` : "Not set yet"}
                      </span>
                      {vitals.weight && vitals.height ? (
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
                      {vitals.bloodType ? (
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
                        {vitals
                          ? `Rh ${vitals.bloodRh === "POS" ? "Positive" : "Negative"}`
                          : "Not set yet"}
                      </span>
                      <span className="font-medium text-foreground">
                        {vitals ? "Donor Match" : "Click to select"}
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
                      setFamilyType([]);
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
                {familyArr && Object.keys(familyArr).length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.values(familyArr).map((member) => {
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
                        setFamilyType([]);
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

      {/* ================= EDIT VITALS MODAL ================= */}
      {isEditVitalsOpen && (
        <div onClick={() => setIsEditVitalsOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <EditVitals setIsEditVitalsOpen={setIsEditVitalsOpen} />
          </div>
        </div>
      )}

      {/* ================= EDIT EMERGENCY CONTACT MODAL ================= */}
      {isEditEmergencyOpen && (
        <div onClick={() => setIsEditEmergencyOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
        <div onClick={() => setIsEditProfileOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <EditProfileForm setIsEditProfileOpen={setIsEditProfileOpen} isEditProfileOpen={isEditProfileOpen} />

          </div>
        </div>
      )}

      {/* ================= EDIT PROFILE INFO MODAL ================= */}
      {followingDialog && (
        <div onClick={() => setFollowingDialog(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="followers-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <h2 id="followers-title">
              Following
            </h2>

            {followersLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : followersData.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No following yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {followersData.map((person) => (
                  <div
                    key={person.uid}
                    className="flex items-center gap-3 py-4"
                  >
                    {/* Profile Image */}
                    <img
                      src={person.photoURL || "/default-avatar.png"}
                      alt={person.name || "User"}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      {/* Name + Username */}
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {person.name || "Unknown User"}
                        </p>

                        {person.username && (
                          <span className="truncate text-sm text-muted-foreground">
                            @{person.username}
                          </span>
                        )}
                      </div>

                      {/* Email */}
                      {person.email && (
                        <p className="truncate text-sm text-muted-foreground">
                          {person.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT PROFILE INFO MODAL ================= */}
      {followersDialog && (
        <div
          onClick={() => setFollowersDialog(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="followers-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            <h2 id="followers-title">
              Followers
            </h2>

            {followersLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : followersData.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No followers yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {followersData.map((person) => (
                  <div
                    key={person.uid}
                    className="flex items-center gap-3 py-4"
                  >
                    {/* Profile Image */}
                    <img
                      src={person.photoURL || "/default-avatar.png"}
                      alt={person.name || "User"}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      {/* Name + Username */}
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {person.name || "Unknown User"}
                        </p>

                        {person.username && (
                          <span className="truncate text-sm text-muted-foreground">
                            @{person.username}
                          </span>
                        )}
                      </div>

                      {/* Email */}
                      {person.email && (
                        <p className="truncate text-sm text-muted-foreground">
                          {person.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ADD FAMILY MEMBER MODAL ================= */}
      {isAddFamilyOpen && (
        <div onClick={() => setIsAddFamilyOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                  <UserSearchBox onSelect={(user) => setSelected([...selected, { user }])} />


                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.length > 0 && (
                    <div className="w-full mt-3 flex flex-col gap-2">
                      {selected.map((item) => {
                        const relation =
                          familyType.find((relation) => relation.uid === item.user.uid)?.type || "";
                        console.log(familyType);

                        return (
                          <div
                            key={item.user.uid}
                            className="flex w-full items-center gap-3 rounded-xl border border-border bg-primary/5 p-3"
                          >
                            {/* Avatar */}
                            {item.user.photoURL ? (
                              <Image
                                src={item.user.photoURL}
                                alt={item.user.name || "User"}
                                width={40}
                                height={40}
                                className="size-10 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                                {item.user.name?.[0]?.toUpperCase() || "V"}
                              </div>
                            )}

                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {item.user.name || "Unknown User"}
                              </p>

                              {item.user.username && (
                                <p className="truncate text-xs text-muted-foreground">
                                  @{item.user.username}
                                </p>
                              )}
                            </div>

                            {/* Relationship */}
                            <div className="relative w-full sm:w-44">
                              <select
                                value={relation}
                                onChange={(e) => {
                                  const type = e.target.value;

                                  setFamilyType((previous) => {
                                    const exists = previous.some(
                                      (relation) => relation.uid === item.user.uid
                                    );

                                    if (exists) {
                                      return previous.map((relation) =>
                                        relation.uid === item.user.uid
                                          ? { ...relation, type }
                                          : relation
                                      );
                                    }

                                    return [...previous, { uid: item.user.uid, type }];
                                  });
                                }}
                                className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                              >
                                <option value="">Relationship *</option>
                                <option value="parent">Parent</option>
                                <option value="child">Child</option>
                                <option value="sibling">Sibling</option>
                                <option value="spouse">Spouse</option>
                                <option value="grandparent">Grandparent</option>
                                <option value="grandchild">Grandchild</option>
                              </select>

                              <ChevronDown
                                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                              />
                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelected((previous) =>
                                  previous.filter((selectedItem) =>
                                    selectedItem.user.uid !== item.user.uid
                                  )
                                );

                                setFamilyType((previous) =>
                                  previous.filter(
                                    (relation) => relation.uid !== item.user.uid
                                  )
                                );
                              }}
                              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                              aria-label={`Remove ${item.user.name || "user"}`}
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

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
                  disabled={!selected.length > 0}
                  className="rounded-xl cursor-pointer bg-primary px-5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
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
        <div onClick={() => setIsShareModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                        .catch(() => { });
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
        <div onClick={() => setIsEditCredentialsOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
        <div onClick={() => setIsSignOutModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
    </div >
  );
}
