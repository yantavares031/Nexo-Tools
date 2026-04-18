"use client";

import { useActionState } from "react";
import { updateAgenciaAction } from "@/app/actions/agencia";
import { CurrencyInput } from "@/components/CurrencyInput";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { Agencia } from "@/types/globals";

interface BoardOption {
  id: string;
  nome: string;
}

interface AgenciaFormProps {
  agencia: Agencia;
  boards?: BoardOption[];
}

export function AgenciaForm({ agencia, boards = [] }: AgenciaFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateAgenciaAction.bind(null, agencia.id),
    null
  );
  useToastOnActionError(state);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="nomeFantasia"
          className="mb-1 block text-sm font-medium text-slate-600"
        >
          Nome fantasia *
        </label>
        <input
          id="nomeFantasia"
          name="nomeFantasia"
          type="text"
          required
          defaultValue={agencia.nomeFantasia}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          placeholder="Ex: La Marka"
        />
      </div>

      <div>
        <label
          htmlFor="cnpj"
          className="mb-1 block text-sm font-medium text-slate-600"
        >
          CNPJ *
        </label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          required
          defaultValue={agencia.cnpj}
          disabled={isPending}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          placeholder="00.000.000/0001-00"
        />
      </div>

      <div>
        <label
          htmlFor="orcamentoAnual"
          className="mb-1 block text-sm font-medium text-slate-600"
        >
          Limite orçamento anual (R$)
        </label>
        <CurrencyInput
          id="orcamentoAnual"
          name="orcamentoAnual"
          defaultValue={agencia.orcamentoAnual}
          disabled={isPending}
          className="disabled:opacity-50"
        />
      </div>

      {boards.length > 0 ? (
        <div>
          <label
            htmlFor="boardId"
            className="mb-1 block text-sm font-medium text-slate-600"
          >
            Board Deskfy
          </label>
          <select
            id="boardId"
            name="boardId"
            defaultValue={agencia.boardId ?? ""}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">Nenhum</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="pt-2">
        <FormActionSubmitButton pending={isPending} pendingLabel="Atualizando...">
          Atualizar
        </FormActionSubmitButton>
      </div>
    </form>
  );
}
