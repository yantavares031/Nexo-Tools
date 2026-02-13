"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SearchParamsToaster() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const removed = searchParams.get("removed");
    const error = searchParams.get("error");

    if (created === "1") {
      toast.success("Centro de custo criado com sucesso");
    } else if (updated === "1") {
      toast.success("Centro de custo atualizado com sucesso");
    } else if (removed === "1") {
      toast.success("Centro de custo removido com sucesso");
    } else if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  return null;
}
