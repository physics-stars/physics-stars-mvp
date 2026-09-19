"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { NoticeState } from "@/components/ui/Notice";
import type { ApiResult } from "@/lib/utils/api-client";

/*
 * Hook compartit pels panells de gestió: executa una acció contra l'API,
 * gestiona l'estat "ocupat", mostra un avís d'èxit/error i, si tot va bé,
 * refresca les dades del servidor. Evita repetir aquest patró a cada botó.
 */
export function useManagementAction() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  // Retorna `true` si l'acció ha funcionat.
  const run = useCallback(
    async <T,>(
      action: () => Promise<ApiResult<T>>,
      options: { successMessage?: string; onSuccess?: (data: T) => void; refresh?: boolean } = {},
    ): Promise<boolean> => {
      setNotice(null);
      setIsBusy(true);
      const result = await action();
      setIsBusy(false);

      if (!result.ok) {
        setNotice({ tone: "error", message: result.error });
        return false;
      }
      if (options.successMessage) {
        setNotice({ tone: "success", message: options.successMessage });
      }
      options.onSuccess?.(result.data);
      if (options.refresh !== false) router.refresh();
      return true;
    },
    [router],
  );

  return { isBusy, notice, setNotice, dismissNotice, run };
}
