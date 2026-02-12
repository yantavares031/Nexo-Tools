"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SearchParamsToaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownRef = useRef(false);

  useEffect(() => {
    if (searchParams.has("removed") && !shownRef.current) {
      toast.success("Usuário removido com sucesso.");
      shownRef.current = true;
      router.replace("/usuarios");
    }
    if (searchParams.has("updated") && !shownRef.current) {
      toast.success("Usuário atualizado com sucesso.");
      shownRef.current = true;
      router.replace("/usuarios");
    }
    if (!searchParams.has("removed") && !searchParams.has("updated")) {
      shownRef.current = false;
    }
  }, [searchParams, router]);

  return null;
}
