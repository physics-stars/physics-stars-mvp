"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  buildCredentialsText,
  credentialsFileName,
  downloadTextFile,
  type CredentialRow,
} from "@/lib/utils/credentials-file";

/*
 * Mostra les credencials d'un o diversos comptes acabats de crear (o
 * d'una contrasenya reiniciada) UN SOL COP, amb opcions per copiar-les i
 * descarregar-les en un .txt. Un cop es tanca, no es poden tornar a
 * consultar: per això avisa abans de tancar si no s'han desat.
 */
interface CredentialsPanelProps {
  title: string;
  rows: CredentialRow[];
  classroomName?: string | null;
  fileLabel: string;
  onClose: () => void;
}

export function CredentialsPanel({
  title,
  rows,
  classroomName,
  fileLabel,
  onClose,
}: CredentialsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const text = buildCredentialsText({ title, rows, classroomName });

  function handleDownload() {
    downloadTextFile(credentialsFileName(fileLabel), text);
    setSaved(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSaved(true);
    } catch {
      // Sense accés al porta-retalls: sempre queda l'opció de descarregar.
    }
  }

  function handleClose() {
    if (!saved && rows.length > 1) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border-2 border-brand-primary bg-parchment shadow-[0_10px_30px_-12px_rgba(53,40,26,0.5)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-parchment-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/20 text-wood">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h3 className="heading-display text-base font-bold text-foreground">{title}</h3>
            <p className="text-sm text-foreground-muted">
              Desa-les ara: <strong>no es tornaran a mostrar</strong>. Si t&apos;oblides d&apos;una
              contrasenya, es pot reiniciar.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tanca"
          className="rounded-lg p-1 text-foreground-muted hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-72 overflow-auto px-5 py-3">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-parchment text-xs uppercase tracking-wide text-foreground-muted">
            <tr>
              <th className="py-2 pr-4 font-semibold">Nom</th>
              <th className="py-2 pr-4 font-semibold">Usuari</th>
              <th className="py-2 font-semibold">Contrasenya</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.username} className="border-t border-parchment-border/60">
                <td className="py-2 pr-4 text-foreground">{row.displayName}</td>
                <td className="py-2 pr-4 font-mono text-foreground">{row.username}</td>
                <td className="py-2 font-mono font-semibold text-wood">{row.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-parchment-border bg-background/50 px-5 py-3">
        <Button type="button" fullWidth={false} size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Descarrega .txt
        </Button>
        <Button type="button" variant="secondary" fullWidth={false} size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          {copied ? "Copiat!" : "Copia-ho tot"}
        </Button>
        <span className="ml-auto text-xs text-foreground-muted">
          {rows.length} {rows.length === 1 ? "compte" : "comptes"}
        </span>
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="Tancar sense desar?"
        description="Encara no has descarregat ni copiat les contrasenyes i no es podran tornar a consultar."
        confirmLabel="Tanca igualment"
        onConfirm={onClose}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}
