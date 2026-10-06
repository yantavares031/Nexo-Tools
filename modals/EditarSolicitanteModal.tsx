"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { updateSolicitanteAction } from "@/app/actions/solicitante";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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
        <h2 id="modal-editar-solicitante-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <UserPlus className="size-5 shrink-0" />
          Editar solicitante
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="editar-solicitante-form" action={formAction}>
        <input type="hidden" name="id" value={solicitante.id} />
        <div className="space-y-4">
          <FormField id="editar-nome" label="Nome *">
            <Input
              id="editar-nome"
              name="nome"
              type="text"
              required
              defaultValue={solicitante.nome}
              disabled={isPending}
              placeholder="Nome do solicitante"
            />
          </FormField>

          <FormField id="editar-unResponsavel" label="Un. responsável (opcional)">
            <Input
              id="editar-unResponsavel"
              name="unResponsavel"
              type="text"
              list="unidades-editar-solicitante"
              autoComplete="off"
              defaultValue={solicitante.unResponsavel ?? ""}
              disabled={isPending}
              placeholder="Unidade"
            />
            <datalist id="unidades-editar-solicitante">
              {unidades.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" form="editar-solicitante-form" loading={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
