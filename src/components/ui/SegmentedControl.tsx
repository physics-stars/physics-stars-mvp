"use client";

import { clsx } from "@/lib/utils/clsx";

/*
 * Selector d'una opció entre poques (com unes pestanyes petites): més
 * ràpid i visual que un desplegable quan només hi ha 2-3 opcions.
 */
interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-foreground/10 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={clsx(
            "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
            option.value === value
              ? "bg-parchment text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
