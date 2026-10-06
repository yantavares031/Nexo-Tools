"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { ConfirmModal, type ConfirmOptions } from "@/modals/confirm-modal";

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<{ confirm: ConfirmFn } | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function handleResolve(value: boolean) {
    resolver.current?.(value);
    resolver.current = undefined;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal options={options} onResolve={handleResolve} />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>.");
  return context;
}
