"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Megaphone } from "lucide-react";
import { createAgenciaAction } from "@/app/actions/agencia";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Modal } from "@/components/Modal";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";

interface BoardOption {
  id: string;
  nome: string;
}

interface AdicionarAgenciaModalProps {
  open: boolean;
  onClose: () => void;
  boards?: BoardOption[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      form="adicionar-agencia-form"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
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

export function AdicionarAgenciaModal({
  open,
  onClose,
  boards = [],
}: AdicionarAgenciaModalProps) {
  const [state, formAction] = useActionState(createAgenciaAction, null);
  useToastOnActionError(state);

  return (
    <Modal open={open} onClose={onClose} maxWidth="md" ariaLabelledby="modal-agencia-title">
      <Modal.Header onClose={onClose}>
        <h2 id="modal-agencia-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Megaphone className="size-5 shrink-0" />
          Nova agência
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="adicionar-agencia-form" action={formAction}>
        <div className="space-y-4">
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
              defaultValue={0}
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
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <SubmitButton />
      </Modal.Footer>
    </Modal>
  );
}
