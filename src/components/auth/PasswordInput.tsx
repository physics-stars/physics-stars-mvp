"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Camp de contrasenya amb botó per mostrar/amagar el text introduït.
 * Embolcalla el mateix look que `Input` (incloent el "to" pergamí/fosc)
 * però afegeix el botó de l'ull, que `Input` no necessita a la resta de
 * formularis (allà les contrasenyes es generen, no es tecleja mai).
 */
interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  tone?: "dark" | "parchment";
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, id, className, tone = "dark", ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    const isParchment = tone === "parchment";

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className={clsx(
            "text-sm font-medium",
            isParchment ? "text-parchment-ink-muted" : "text-foreground-muted",
          )}
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={clsx(
              "w-full rounded-lg border px-3 py-2.5 pr-11 text-sm transition-colors focus:outline-none focus:ring-2",
              isParchment
                ? "border-parchment-border bg-white/40 text-parchment-ink placeholder:text-parchment-ink-muted/60 focus:ring-brand-primary"
                : "border-border-subtle bg-background-elevated text-foreground placeholder:text-foreground-muted/60 focus:ring-brand-primary",
              error && "border-danger",
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            tabIndex={-1}
            aria-label={visible ? "Amaga la contrasenya" : "Mostra la contrasenya"}
            className={clsx(
              "absolute inset-y-0 right-0 flex w-10 items-center justify-center transition-colors",
              isParchment
                ? "text-parchment-ink-muted hover:text-parchment-ink"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
