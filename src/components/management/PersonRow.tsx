import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { clsx } from "@/lib/utils/clsx";
import type { ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Fila d'una persona (alumne o professor) a les llistes de gestió:
 * casella de selecció opcional, avatar amb inicials, nom, usuari, estat
 * i un espai per a les accions. Una sola fila per a tots els panells
 * perquè l'aspecte i el comportament siguin idèntics a tot arreu.
 */
interface PersonRowProps {
  user: ManagedUserView;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  actions?: ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export function PersonRow({ user, selectable, selected, onToggleSelect, actions }: PersonRowProps) {
  return (
    <li
      className={clsx(
        "flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        selected ? "border-brand-primary bg-brand-primary/10" : "border-border-subtle bg-background/60",
        !user.isActive && "opacity-70",
      )}
    >
      {selectable && (
        <input
          type="checkbox"
          checked={Boolean(selected)}
          onChange={onToggleSelect}
          aria-label={`Selecciona ${user.displayName}`}
          className="h-4 w-4 shrink-0 accent-[var(--wood)]"
        />
      )}
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wood/15 text-xs font-bold text-wood"
      >
        {initials(user.displayName)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-foreground">{user.displayName}</span>
          {!user.isActive && <Badge tone="danger">Desactivat</Badge>}
        </div>
        <span className="font-mono text-xs text-foreground-muted">{user.username}</span>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
    </li>
  );
}
