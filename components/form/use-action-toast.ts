"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { FormState } from "@/lib/form-state";

export function useActionToast<Field extends string>(state: FormState<Field>) {
  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.message) toast.error(state.message);
  }, [state]);
}
