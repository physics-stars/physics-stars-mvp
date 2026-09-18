import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Camp de text reutilitzable amb etiqueta i missatge d'error opcional.
 * Admet dos "tons" perquè es pugui fer servir tant sobre panells foscos
 * (per defecte) com sobre panells de pergamí (p. ex. el login): mateix
 * component, mateix comportament, només canvien els colors.
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  tone?: "dark" | "parchment";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, tone = "dark", ...rest }, ref) => {
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
        <input
          ref={ref}
          id={id}
          className={clsx(
            "rounded-lg border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2",
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
        {error && (
          <p id={`${id}-error`} className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
