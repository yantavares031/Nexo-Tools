"use client";

import { useEscapeKey } from "@/lib/use-escape-key";
import { AlertTriangle } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmModalProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEscapeKey(onCancel, open);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[60] flex min-h-[100dvh] min-w-full items-center justify-center p-4">
      <div
        className="absolute inset-0 min-h-[100dvh] min-w-full bg-black/40"
        onClick={onCancel}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        aria-modal
      >
        <div className="flex gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-full p-2 ${
              isDanger ? "bg-red-100" : "bg-slate-100"
            }`}
          >
            <AlertTriangle
              className={`size-6 ${isDanger ? "text-red-600" : "text-slate-600"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-slate-800"
            >
              {title}
            </h2>
            <p id="confirm-message" className="mt-1 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
