"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Exibe toast de erro quando a action retorna error. Usar com useActionState. */
export function useToastOnActionError(
  state: { error?: string } | null
) {
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (state?.error && state.error !== lastErrorRef.current) {
      toast.error(state.error);
      lastErrorRef.current = state.error;
    }
    if (!state?.error) {
      lastErrorRef.current = null;
    }
  }, [state?.error]);
}
