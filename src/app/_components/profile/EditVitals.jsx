"use client";
import { useApp } from "@/lib/AppProvider";
import { rtdb } from "@/lib/firebase";
import { onValue, ref, update } from "firebase/database";
import { AlertCircle, X } from "lucide-react";
import { useState,useEffect } from "react";

export function EditVitals({ setIsEditVitalsOpen }) {
  const { loading, userData, refreshUserData } = useApp();
  const [tempVitals, setTempVitals] = useState({
    height: "",
    weight: "",
    bloodType: "O",
    bloodRh: "POS",
  });
  const [formError, setFormError] = useState("");
  const [savingVitals, setSavingVitals] = useState(false);
useEffect(()=>{
  if(!userData) return;
  const vitals = onValue(ref(rtdb, `records/${userData.uid}/vitals`), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      setTempVitals({
        height: data.height || "",
        weight: data.weight || "",
        bloodType: data.bloodType || "O",
        bloodRh: data.bloodRh || "POS",
      });
    }
  });
  return () => vitals(); // Cleanup the listener on unmount
},[userData])
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

      const refdb = ref(rtdb, `records/${userData.uid}/vitals`);
      await update(refdb, payload.vitals);
      setIsEditVitalsOpen(false);
      showToast("Vitals saved to database!");
    } catch (err) {
      setFormError(err.message || "Could not save vitals.");
    } finally {
      setSavingVitals(false);
    }
  };
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
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
              ).toFixed(1) === "NaN" ? "Enter values" : (
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
  );
}
