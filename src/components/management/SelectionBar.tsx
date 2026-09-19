"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/*
 * Barra flotant que apareix a la part inferior quan hi ha alumnat
 * seleccionat: sempre a l'abast, encara que la selecció s'hagi fet molt
 * amunt a la llista. Serveix per moure'l a una altra aula (o deixar-lo
 * "sense aula").
 */
export interface MoveTargetOption {
  value: string;
  label: string;
}

interface SelectionBarProps {
  count: number;
  options: MoveTargetOption[];
  target: string;
  onTargetChange: (value: string) => void;
  onMove: () => void;
  onClear: () => void;
  isBusy: boolean;
}

export function SelectionBar({
  count,
  options,
  target,
  onTargetChange,
  onMove,
  onClear,
  isBusy,
}: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="band-wood mx-auto flex w-full max-w-3xl flex-wrap items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
        <span className="rounded-full bg-parchment/15 px-3 py-1 text-sm font-semibold">
          {count} {count === 1 ? "seleccionat" : "seleccionats"}
        </span>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span className="shrink-0 text-parchment/80">Mou a</span>
          <select
            value={target}
            onChange={(event) => onTargetChange(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-parchment/20 bg-parchment px-3 py-2 text-sm text-foreground"
          >
            <option value="">Sense aula</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" fullWidth={false} isLoading={isBusy} onClick={onMove}>
          Mou
        </Button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Cancel·la la selecció"
          className="rounded-lg p-2 text-parchment/80 hover:bg-parchment/10 hover:text-parchment"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
