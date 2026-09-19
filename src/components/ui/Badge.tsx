import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Etiqueta petita d'estat ("Actiu", "Desactivat", "Properament"...).
 * Els tons estan pensats perquè un estat es reconegui d'un cop d'ull
 * a les llistes de gestió, sense haver de llegir el text.
 */
type BadgeTone = "neutral" | "success" | "danger" | "accent" | "wood";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-foreground/10 text-foreground-muted",
  success: "bg-emerald-600/15 text-emerald-800",
  danger: "bg-danger/15 text-danger",
  accent: "bg-brand-primary/20 text-wood",
  wood: "bg-wood text-parchment",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
