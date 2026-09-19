import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/utils/clsx";

// Àrea de text amb etiqueta i ajuda opcional, amb l'estil de `Input`.
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, id, className, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground-muted">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          "min-h-24 rounded-lg border border-border-subtle bg-background px-3 py-2.5 text-sm text-foreground",
          "placeholder:text-foreground-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary",
          className,
        )}
        {...rest}
      />
      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </div>
  ),
);

Textarea.displayName = "Textarea";
