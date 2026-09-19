"use client";

import { clsx } from "@/lib/utils/clsx";

/*
 * Interruptor accessible (role="switch") per activar/desactivar coses
 * com la visibilitat d'un món o la disponibilitat d'un nivell.
 */
interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-wood bg-wood" : "border-border-subtle bg-background-elevated-strong",
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 rounded-full shadow transition-transform",
          checked ? "translate-x-6 bg-parchment" : "translate-x-1 bg-foreground-muted/70",
        )}
      />
    </button>
  );
}
