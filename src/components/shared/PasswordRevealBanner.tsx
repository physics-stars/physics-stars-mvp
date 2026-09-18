"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/*
 * Mostra una contrasenya generada (en crear un compte o reiniciar-la)
 * UN COP, amb un botó per copiar-la. Un cop es tanca, ja no es pot
 * tornar a consultar: només queda l'opció de reiniciar-la de nou.
 */
interface PasswordRevealBannerProps {
  username: string;
  plainPassword: string;
  onClose: () => void;
}

export function PasswordRevealBanner({
  username,
  plainPassword,
  onClose,
}: PasswordRevealBannerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainPassword);
      setCopied(true);
    } catch {
      // Si el porta-retalls no és accessible, l'usuari sempre pot copiar-la a mà.
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-brand-primary bg-background-elevated p-4">
      <p className="text-sm text-foreground">
        Contrasenya generada per a <strong>{username}</strong>: apunta-la ara,
        no es tornarà a mostrar.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-background px-3 py-1.5 text-base font-mono tracking-wide text-brand-primary">
          {plainPassword}
        </code>
        <Button type="button" variant="secondary" fullWidth={false} onClick={handleCopy}>
          {copied ? "Copiada!" : "Copia"}
        </Button>
        <Button type="button" variant="ghost" fullWidth={false} onClick={onClose}>
          Tanca
        </Button>
      </div>
    </div>
  );
}
