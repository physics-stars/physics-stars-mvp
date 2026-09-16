"use client";

import { useCallback, useState } from "react";

/*
 * Hook per gestionar la selecció múltiple d'alumnat (checkboxes) als
 * panells de gestió d'aules. Compartit entre el gestor de professorat i
 * el d'administració perquè tots dos necessiten exactament el mateix
 * comportament de selecció.
 */
export function useStudentSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return { selectedIds, toggle, clear };
}
