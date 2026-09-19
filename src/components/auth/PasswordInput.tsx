"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Camp de contrasenya amb botó per mostrar/amagar el text introduït.
 * Embolcalla el mateix look que `Input`, però afegeix el botó de l'ull,
 * que `Input` no necessita a la resta de formularis (allà les
 * contrasenyes es generen, no es tecleja mai).
 */
interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={clsx(
              "w-full rounded-lg border border-border-subtle bg-background px-3 py-2.5 pr-11 text-sm text-foreground transition-colors",
              "placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary",
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
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-foreground-muted transition-colors hover:text-foreground"
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
