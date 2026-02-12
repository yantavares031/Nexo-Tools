"use client";

import { useActionState } from "react";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useFormStatus } from "react-dom";
import { X, Users } from "lucide-react";
import { createUserAction } from "@/app/actions/user";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { Agencia } from "@/types/globals";
interface AdicionarUsuarioModalProps {
  open: boolean;
  onClose: () => void;
  agencias: Agencia[];
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

export function AdicionarUsuarioModal({
  open,
  onClose,
  agencias,
}: AdicionarUsuarioModalProps) {
  const [state, formAction] = useActionState(createUserAction, null);
  useToastOnActionError(state);
  useEscapeKey(onClose, open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] min-w-full items-center justify-center p-4">
      <div
        className="absolute inset-0 min-h-[100dvh] min-w-full bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="modal-usuario-title"
        aria-modal
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <h2
            id="modal-usuario-title"
            className="flex items-center gap-2 text-lg font-semibold text-slate-800"
          >
            <Users className="size-5 shrink-0" />
            Novo usuário
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
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                E-mail *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Senha *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="Nome do usuário"
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Perfil *
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="operator">Operador</option>
                <option value="admin">Admin</option>
                <option value="agency">Agência</option>
              </select>
            </div>

            <div id="agencia-field">
              <label
                htmlFor="agenciaId"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Agência
              </label>
              <select
                id="agenciaId"
                name="agenciaId"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Selecione (obrigatório para perfil Agência)</option>
                {agencias.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nomeFantasia}
                  </option>
                ))}
              </select>
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
