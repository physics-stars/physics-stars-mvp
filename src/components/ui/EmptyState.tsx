import type { ReactNode } from "react";

// Missatge per a llistes buides: explica què falta i, si cal, què fer.
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle px-6 py-8 text-center">
      {icon && <span className="text-foreground-muted">{icon}</span>}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground-muted">{description}</p>}
    </div>
  );
}
