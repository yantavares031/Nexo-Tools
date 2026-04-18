"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createSolicitanteAction } from "@/app/actions/solicitante";
import { Modal } from "@/components/Modal";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";

interface AdicionarSolicitanteModalProps {
  open: boolean;
  onClose: () => void;
  unidades: string[];
}

export function AdicionarSolicitanteModal({
  open,
  onClose,
  unidades,
}: AdicionarSolicitanteModalProps) {
  const [state, formAction, isPending] = useActionState(createSolicitanteAction, null);
  useToastOnActionError(state);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      ariaLabelledby="modal-solicitante-title"
      escapeEnabled={!isPending}
      closeOnOverlayClick={!isPending}
    >
      <Modal.Header onClose={onClose} closeDisabled={isPending}>
        <h2 id="modal-solicitante-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <UserPlus className="size-5 shrink-0" />
          Novo solicitante
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="adicionar-solicitante-form" action={formAction}>
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
              disabled={isPending}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              placeholder="Nome do solicitante"
            />
          </div>

          <div>
            <label
              htmlFor="unResponsavel"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Un. Responsável (opcional)
            </label>
            <input
              id="unResponsavel"
              name="unResponsavel"
              type="text"
              list="unidades-solicitante"
              autoComplete="off"
              disabled={isPending}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              placeholder="Unidade"
            />
            <datalist id="unidades-solicitante">
              {unidades.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
        >
          Cancelar
        </button>
        <FormActionSubmitButton
          form="adicionar-solicitante-form"
          pending={isPending}
          pendingLabel="Adicionando..."
        >
          Adicionar
        </FormActionSubmitButton>
      </Modal.Footer>
    </Modal>
  );
}
