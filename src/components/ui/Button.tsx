import { ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Botó reutilitzable de la interfície. Centralitza els estils perquè
 * tots els botons de l'aplicació (login, menús, joc, professorat,
 * administració...) es vegin consistents sense repetir classes de
 * Tailwind arreu.
 *
 * `fullWidth` (per defecte `true`) controla si el botó ocupa tot
 * l'ample del seu contenidor. NOMÉS s'ha de controlar amb aquesta prop,
 * mai afegint "w-auto"/"w-XX" via `className`: com que Tailwind decideix
 * quina classe "guanya" segons l'ordre en què apareixen al full d'estil
 * generat (no segons l'ordre dins l'atribut `class` de l'HTML), un
 * "w-auto" passat per `className` no substitueix de manera fiable el
 * "w-full" per defecte encara que aparegui després a la cadena de text.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "ghostDanger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
  size?: "md" | "sm";
}

const sizeClasses = {
  md: "px-4 py-2.5 text-sm",
  sm: "gap-1.5 px-3 py-1.5 text-xs",
} as const;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-wood-dark hover:bg-brand-primary-hover shadow-[0_4px_10px_-4px_rgba(53,40,26,0.4)] focus-visible:outline-brand-primary",
  secondary:
    "bg-background-elevated-strong text-foreground border border-border-subtle hover:border-brand-primary focus-visible:outline-brand-primary",
  ghost: "bg-transparent text-foreground-muted hover:bg-foreground/5 hover:text-foreground",
  ghostDanger: "bg-transparent text-danger hover:bg-danger/10",
  danger:
    "bg-danger text-parchment hover:bg-danger/90 focus-visible:outline-danger",
};

export function Button({
  variant = "primary",
  isLoading = false,
  fullWidth = true,
  size = "md",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
        sizeClasses[size],
        fullWidth && "w-full",
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
