"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";
import type { World } from "@prisma/client";

/*
 * Explorador de mons: llista seleccionable a l'esquerra (panell fosc),
 * detall del món seleccionat a la dreta (panell de pergamí). Tota la
 * interactivitat (quin món està seleccionat) és local a aquest
 * component de client; les dades venen ja carregades del servidor.
 */
interface WorldExplorerProps {
  worlds: World[];
}

export function WorldExplorer({ worlds }: WorldExplorerProps) {
  const [selectedId, setSelectedId] = useState(worlds[0]?.id ?? null);
  const selected = worlds.find((world) => world.id === selectedId) ?? worlds[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="panel-glass flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-3 lg:max-h-[600px]">
        {worlds.map((world) => {
          const isActive = world.id === selected?.id;
          const isLocked = !world.isAvailable;
          return (
            <button
              key={world.id}
              type="button"
              onClick={() => setSelectedId(world.id)}
              className={clsx(
                "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                isActive
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-transparent hover:border-border-subtle hover:bg-background-elevated-strong",
                isLocked && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{world.name}</span>
                {isLocked && <Lock className="h-4 w-4 shrink-0 text-foreground-muted" />}
              </div>
              <span className="text-xs text-foreground-muted">{world.shortDescription}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="panel-parchment flex flex-col gap-6 p-6 sm:p-8">
          <div>
            <span className="eyebrow text-brand-primary/80">{selected.tagline}</span>
            <h2 className="heading-display mt-1 text-3xl font-bold text-parchment-ink">
              {selected.name}
            </h2>
          </div>

          <p className="leading-relaxed text-parchment-ink-muted">{selected.description}</p>

          {selected.objectives.length > 0 && (
            <div className="rounded-xl border border-parchment-border bg-white/30 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-parchment-ink">
                <Sparkles className="h-4 w-4" />
                Missions clau
              </h3>
              <ul className="flex flex-col gap-1.5">
                {selected.objectives.map((objective) => (
                  <li key={objective} className="flex items-start gap-2 text-sm text-parchment-ink-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-parchment-ink/50" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-parchment-border pt-5">
            <span className="text-sm font-semibold text-parchment-ink-muted">
              {selected.isAvailable ? "Món obert" : "Món tancat"}
            </span>
            {selected.isAvailable ? (
              <Link
                href={`/menu/${selected.slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-parchment-ink transition-colors hover:bg-brand-primary-hover"
              >
                Viatja
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-parchment-ink/10 px-5 py-2.5 text-sm font-bold text-parchment-ink-muted">
                <Lock className="h-4 w-4" />
                Properament
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
