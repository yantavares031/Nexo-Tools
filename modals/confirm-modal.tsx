"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type Props = {
  options: ConfirmOptions | null;
  onResolve: (confirmed: boolean) => void;
};

export function ConfirmModal({ options, onResolve }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (options && !dialog.open) dialog.showModal();
    if (!options && dialog.open) dialog.close();
  }, [options]);

  const danger = options?.variant === "danger";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onResolve(false);
      }}
      onClick={(event) => event.target === dialogRef.current && onResolve(false)}
      className="fixed inset-0 m-auto w-[min(26rem,calc(100%-2rem))] rounded-xl bg-white p-0 shadow-2xl ring-1 ring-neutral-900/10 backdrop:bg-neutral-950/30"
    >
      {options && (
        <div className="p-6">
          <div className="flex gap-4">
            {danger && (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <TriangleAlert className="size-5" aria-hidden />
              </span>
            )}
            <div className="space-y-1">
              <h2 id="confirm-modal-title" className="text-[15px] font-semibold text-neutral-950">
                {options.title ?? "Confirmar"}
              </h2>
              {options.message && <p className="text-[13px] text-neutral-500">{options.message}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onResolve(false)}>
              {options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button
              autoFocus
              onClick={() => onResolve(true)}
              className={cn(danger && "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600")}
            >
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
