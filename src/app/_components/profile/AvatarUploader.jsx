"use client";

import { Camera, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { uploadToStorage } from "@/lib/client/upload";
import { ref, update } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useApp } from "@/lib/AppProvider";

const BUTTON =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

/** Uploads/removes the profile photo immediately; the rest of the form saves separately. */
export function AvatarUploader({ photoURL, }) {
  const { userData } = useApp();
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [percent, setPercent] = useState(false);




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






  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid size-24 place-items-center overflow-hidden rounded-full border border-border bg-primary/20 text-3xl font-semibold text-primary">
        {userData.avatarURL ? (
          <Image
            src={userData.avatarURL || ""}
            alt={userData?.name || "Profile Photo"}
            fill
            sizes="96px"
            unoptimized
            className="object-cover"
          />) : (
          <div className="flex size-full items-center justify-center bg-primary/20 text-2xl font-bold text-primary">
            {userData.name?.[0]?.toUpperCase() || <User className="size-8" />}
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

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleProfilePhotoChange}
        />


        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={Number(percent) != "100" && percent}
          aria-label="Change Photo"
          title="Change Photo"
          className={`${BUTTON} border-primary text-primary hover:bg-primary/10`}
        >
          <Camera className="h-4 w-4" />
          {photoURL ? "Change photo" : "Add photo"}
        </button>


      </div>

      <p className="text-xs text-muted">JPG, PNG or WebP. We crop it to a square.</p>

      {error && (
        <p role="alert" className="text-center text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
