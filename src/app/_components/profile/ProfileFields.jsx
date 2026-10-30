import { Mars, Venus } from "lucide-react";

const LABEL = "text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-muted";
const GENDERS = [
  { value: "male", label: "Male", Icon: Mars },
  { value: "female", label: "Female", Icon: Venus },
];

export function GenderField({ value, onChange, error }) {
  return (
    <div className="flex flex-col gap-2">
      <span id="gender-label" className={LABEL}>
        Gender
      </span>

      <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-2 gap-3">
        {GENDERS.map(({ value: option, label, Icon }) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition ${
              value === option
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:border-primary"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export function BirthdayField({ value, onChange, error, minAge = 18 }) {
  const latest = new Date();
  latest.setFullYear(latest.getFullYear() - minAge);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="birthday" className={LABEL}>
        Birthday
      </label>
      <input
        id="birthday"
        name="birthday"
        type="date"
        value={value}
        max={latest.toISOString().slice(0, 10)}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-surface-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 ${
          error ? "border-red-500" : "border-border"
        }`}
      />
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
