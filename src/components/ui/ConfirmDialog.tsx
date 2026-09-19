"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

/*
 * Finestra de confirmació per a accions destructives (eliminar una aula,
 * un món...). Fa servir l'element natiu <dialog>, que ja gestiona el
 * focus, la tecla Esc i el fons atenuat.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Elimina",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border-2 border-parchment-border bg-parchment p-6 text-foreground shadow-2xl backdrop:bg-wood-dark/50"
    >
      <h2 className="heading-display text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-foreground-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          Cancel·la
        </Button>
        <Button type="button" variant="danger" fullWidth={false} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
