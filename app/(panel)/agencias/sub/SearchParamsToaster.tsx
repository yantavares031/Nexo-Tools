"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  created: "Agência cadastrada com sucesso!",
  updated: "Agência atualizada com sucesso!",
  removed: "Agência removida com sucesso!",
};

export function SearchParamsToaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownRef = useRef<string | null>(null);

  useEffect(() => {
    const key = ["created", "updated", "removed"].find((k) =>
      searchParams.has(k)
    );
    if (!key) {
      shownRef.current = null;
      return;
    }
    if (MESSAGES[key] && shownRef.current !== key) {
      toast.success(MESSAGES[key]);
      shownRef.current = key;
      router.replace("/agencias");
    }
  }, [searchParams, router]);

  return null;
}
