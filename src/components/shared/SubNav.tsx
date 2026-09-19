"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Navegació secundària de les àrees de professorat i administració:
 * pestanyes sota la capçalera per saltar entre les seccions de gestió
 * sense haver de tornar sempre a la pàgina d'inici.
 */
export interface SubNavItem {
  href: string;
  label: string;
  icon?: ReactNode;
}

export function SubNav({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Seccions" className="border-b border-border-subtle bg-background-elevated/60">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-8">
        {items.map((item) => {
          const isActive =
            item.href === items[0].href ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                isActive
                  ? "border-wood text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
