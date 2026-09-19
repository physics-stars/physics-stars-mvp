import type { ReactNode } from "react";

// Xifra destacada amb etiqueta (resum d'un cop d'ull al capdamunt d'una pàgina).
interface StatCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-background-elevated px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wood/10 text-wood">
        {icon}
      </span>
      <div>
        <div className="heading-display text-2xl font-bold leading-none text-foreground">{value}</div>
        <div className="mt-1 text-xs text-foreground-muted">{label}</div>
      </div>
    </div>
  );
}
