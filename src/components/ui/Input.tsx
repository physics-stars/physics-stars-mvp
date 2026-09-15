import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Camp de text reutilitzable amb etiqueta i missatge d'error opcional.
 * S'utilitza al formulari de login i es reutilitzarà a altres formularis
 * (registre, preferències, perfil...) per mantenir el mateix aspecte.
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={clsx(
            "rounded-lg border bg-background-elevated px-3 py-2.5 text-sm text-foreground",
            "placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary",
            error ? "border-danger" : "border-border-subtle",
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
