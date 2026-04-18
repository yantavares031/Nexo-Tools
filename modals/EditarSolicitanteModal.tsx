"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { updateSolicitanteAction } from "@/app/actions/solicitante";
import { Modal } from "@/components/Modal";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { Solicitante } from "@/types/globals";

interface EditarSolicitanteModalProps {
  open: boolean;
  onClose: () => void;
  solicitante: Solicitante | null;
  unidades: string[];
}

export function EditarSolicitanteModal({
  open,
  onClose,
  solicitante,
  unidades,
}: EditarSolicitanteModalProps) {
  const [state, formAction, isPending] = useActionState(updateSolicitanteAction, null);
  useToastOnActionError(state);

  if (!solicitante) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      ariaLabelledby="modal-editar-solicitante-title"
      escapeEnabled={!isPending}
      closeOnOverlayClick={!isPending}
    >
      <Modal.Header onClose={onClose} closeDisabled={isPending}>
        <h2 id="modal-editar-solicitante-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <UserPlus className="size-5 shrink-0" />
          Editar solicitante
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="editar-solicitante-form" action={formAction}>
        <input type="hidden" name="id" value={solicitante.id} />
        <div className="space-y-4">
          <div>
            <label
              htmlFor="editar-nome"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Nome *
            </label>
            <input
              id="editar-nome"
              name="nome"
              type="text"
              required
              defaultValue={solicitante.nome}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              placeholder="Nome do solicitante"
            />
          </div>

          <div>
            <label
              htmlFor="editar-unResponsavel"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Un. Responsável (opcional)
            </label>
            <input
              id="editar-unResponsavel"
              name="unResponsavel"
              type="text"
              list="unidades-editar-solicitante"
              autoComplete="off"
              defaultValue={solicitante.unResponsavel ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              placeholder="Unidade"
            />
            <datalist id="unidades-editar-solicitante">
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
          form="editar-solicitante-form"
          pending={isPending}
          pendingLabel="Salvando..."
        >
          Salvar
        </FormActionSubmitButton>
      </Modal.Footer>
    </Modal>
  );
}
