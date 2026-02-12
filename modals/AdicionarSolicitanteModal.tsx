"use client";

import { useActionState } from "react";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useFormStatus } from "react-dom";
import { X, UserPlus } from "lucide-react";
import { createSolicitanteAction } from "@/app/actions/solicitante";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";

interface AdicionarSolicitanteModalProps {
  open: boolean;
  onClose: () => void;
  unidades: string[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Adicionando...
        </>
      ) : (
        "Adicionar"
      )}
    </button>
  );
}

export function AdicionarSolicitanteModal({
  open,
  onClose,
  unidades,
}: AdicionarSolicitanteModalProps) {
  const [state, formAction] = useActionState(createSolicitanteAction, null);
  useToastOnActionError(state);
  useEscapeKey(onClose, open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="modal-solicitante-title"
        aria-modal
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <h2 id="modal-solicitante-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <UserPlus className="size-5 shrink-0" />
            Novo solicitante
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <form action={formAction} className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Nome *
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="Nome do solicitante"
              />
            </div>

            <div>
              <label
                htmlFor="unResponsavel"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Un. Responsável *
              </label>
              <input
                id="unResponsavel"
                name="unResponsavel"
                type="text"
                list="unidades-solicitante"
                required
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="Unidade"
              />
              <datalist id="unidades-solicitante">
                {unidades.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <div>
                <SubmitButton />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
