"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  created: "Demanda cadastrada com sucesso!",
  updated: "Demanda atualizada com sucesso!",
  removed: "Demanda removida com sucesso!",
};

export function DemandasSearchParamsToaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    const key = ["created", "updated", "removed"].find((k) => searchParams.has(k));
    if (!key) {
      shownRef.current = null;
      return;
    }
    if (MESSAGES[key] && shownRef.current !== key) {
      toast.success(MESSAGES[key]);
      shownRef.current = key;
      const params = new URLSearchParams(searchParams);
      params.delete(key);
      router.replace(params.toString() ? `/?${params.toString()}` : "/");
    }
  }, [searchParams, router]);

  return null;
}
