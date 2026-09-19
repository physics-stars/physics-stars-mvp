"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ChevronLeft, ScrollText } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import { DIFFICULTY_LABELS } from "@/lib/config/difficulty";
import type { Level } from "@prisma/client";

/*
 * Explorador de nivells d'un món: mateix patró que `WorldExplorer`
 * (llista a l'esquerra, detall de pergamí a la dreta), reutilitzant el
 * mateix llenguatge visual perquè es noti que és la mateixa "família"
 * de pantalla.
 */
interface LevelExplorerProps {
  worldName: string;
  levels: Level[];
}

export function LevelExplorer({ worldName, levels }: LevelExplorerProps) {
  const [selectedId, setSelectedId] = useState(levels[0]?.id ?? null);
  const selected = levels.find((level) => level.id === selectedId) ?? levels[0] ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/menu"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna als mons
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="panel-glass flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3 lg:max-h-[600px]">
          {levels.map((level) => {
            const isActive = level.id === selected?.id;
            const isLocked = !level.isAvailable;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setSelectedId(level.id)}
                className={clsx(
                  "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-transparent hover:border-border-subtle hover:bg-background-elevated-strong",
                  isLocked && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {level.levelNumber}. {level.title}
                  </span>
                  {isLocked && <Lock className="h-4 w-4 shrink-0 text-foreground-muted" />}
                </div>
                <span className="text-xs text-foreground-muted">
                  Dificultat: {DIFFICULTY_LABELS[level.difficulty]}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="panel-parchment flex flex-col gap-6 p-6 sm:p-8">
            <div>
              <span className="eyebrow">{worldName}</span>
              <h2 className="heading-display mt-1 text-3xl font-bold text-foreground">
                Nivell {selected.levelNumber}: {selected.title}
              </h2>
            </div>

            <div className="rounded-xl border border-parchment-border bg-background/50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                <ScrollText className="h-4 w-4 text-brand-primary" />
                Briefing de la missió
              </h3>
              <p className="leading-relaxed text-foreground-muted">
                &ldquo;{selected.description}&rdquo;
              </p>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-parchment-border pt-5">
              <span className="text-sm font-semibold text-foreground-muted">
                Dificultat: {DIFFICULTY_LABELS[selected.difficulty]}
              </span>
              {selected.isAvailable ? (
                <span className="inline-flex items-center gap-2 rounded-lg bg-foreground/10 px-5 py-2.5 text-sm font-bold text-foreground-muted">
                  Aviat disponible al joc
                </span>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-foreground/10 px-5 py-2.5 text-sm font-bold text-foreground-muted">
                  <Lock className="h-4 w-4" />
                  Bloquejat
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
