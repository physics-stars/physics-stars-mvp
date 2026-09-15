import { ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Botó reutilitzable de la interfície. Centralitza els estils perquè
 * tots els botons de l'aplicació (login, menús, joc...) es vegin
 * consistents sense repetir classes de Tailwind arreu.
 */

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:outline-brand-primary",
  secondary:
    "bg-background-elevated text-foreground border border-border-subtle hover:border-brand-primary focus-visible:outline-brand-primary",
  ghost: "bg-transparent text-foreground-muted hover:text-foreground",
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "Carregant…" : children}
    </button>
  );
}
