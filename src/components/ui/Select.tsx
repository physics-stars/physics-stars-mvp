import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Desplegable amb etiqueta, amb el mateix aspecte que `Input`. Evita
 * repetir les classes d'un <select> nadiu a cada formulari.
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, className, children, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={clsx(
          "rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  ),
);

Select.displayName = "Select";
