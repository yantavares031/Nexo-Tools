"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ImportacaoSearchParamsToaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!searchParams.has("imported")) {
      shownRef.current = false;
      return;
    }
    if (!shownRef.current) {
      toast.success("Demanda importada com sucesso!");
      shownRef.current = true;
      const params = new URLSearchParams(searchParams);
      params.delete("imported");
      router.replace(params.toString() ? `/demandas/importar?${params.toString()}` : "/demandas/importar");
    }
  }, [searchParams, router]);

  return null;
}
