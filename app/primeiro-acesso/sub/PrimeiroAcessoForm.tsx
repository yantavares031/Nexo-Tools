"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordFirstAccessAction, logoutAction } from "@/app/actions/auth";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-full bg-blue-500/90 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Definir senha e continuar"}
    </button>
  );
}

export function PrimeiroAcessoForm() {
  const [state, formAction] = useActionState(changePasswordFirstAccessAction, null);
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
            className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400"
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
            className="w-full border-b border-slate-200 bg-transparent px-0 py-2.5 text-base text-slate-700 placeholder-slate-300 outline-none transition-colors focus:border-blue-400"
          />
        </div>
        <SubmitButton />
      </form>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="w-full text-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Sair e usar outra conta
        </button>
      </form>
    </div>
  );
}
