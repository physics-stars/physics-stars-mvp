"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Avís visible i descartable per confirmar una acció o explicar un error
 * (substitueix la línia de text perduda que hi havia abans).
 */
export interface NoticeState {
  tone: "success" | "error";
  message: string;
}

interface NoticeProps {
  notice: NoticeState;
  onDismiss: () => void;
}

export function Notice({ notice, onDismiss }: NoticeProps) {
  const isError = notice.tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        isError
          ? "border-danger/40 bg-danger/10 text-danger"
          : "border-emerald-700/30 bg-emerald-600/10 text-emerald-900",
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1">{notice.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tanca l'avís"
        className="opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
