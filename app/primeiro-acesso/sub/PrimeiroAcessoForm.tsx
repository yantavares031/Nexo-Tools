"use client";

import { useActionState } from "react";
import { changePasswordFirstAccessAction, logoutAction } from "@/app/actions/auth";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";

export function PrimeiroAcessoForm() {
  const [state, formAction, isPending] = useActionState(changePasswordFirstAccessAction, null);
  useToastOnActionError(state);

  return (
    <div className="w-full max-w-[320px]">
      <h1 className="text-xl font-medium tracking-tight text-slate-700">Primeiro acesso</h1>
      <p className="mt-1 text-sm text-slate-500">
        Defina uma nova senha para sua conta. Ela substitui a senha temporária.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-slate-500">
            Nova senha
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            disabled={isPending}
            className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400 disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-500">
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Repita a senha"
            disabled={isPending}
            className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400 disabled:opacity-50"
          />
        </div>
        <FormActionSubmitButton
          pending={isPending}
          pendingLabel="Salvando..."
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-blue-500/90 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
        >
          Definir senha e continuar
        </FormActionSubmitButton>
      </form>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full text-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline disabled:pointer-events-none disabled:opacity-40"
        >
          Sair e usar outra conta
        </button>
      </form>
    </div>
  );
}
