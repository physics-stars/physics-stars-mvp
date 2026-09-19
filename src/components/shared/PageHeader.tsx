import type { ReactNode } from "react";

// Capçalera d'una pàgina de gestió: títol, descripció i accions opcionals.
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-foreground-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
