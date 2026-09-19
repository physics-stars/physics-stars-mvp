import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Camp de text reutilitzable amb etiqueta i missatge d'error opcional.
 * Un sol estil (ja no cal distingir "tons" fosc/pergamí: tota
 * l'aplicació comparteix una única paleta clara de pergamí).
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
            "rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground",
            "placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary",
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
