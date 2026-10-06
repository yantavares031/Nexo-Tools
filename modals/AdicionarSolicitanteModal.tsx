"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createSolicitanteAction } from "@/app/actions/solicitante";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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
        <h2 id="modal-solicitante-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <UserPlus className="size-5 shrink-0" />
          Novo solicitante
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="adicionar-solicitante-form" action={formAction}>
        <div className="space-y-4">
          <FormField id="nome" label="Nome *">
            <Input id="nome" name="nome" type="text" required disabled={isPending} placeholder="Nome do solicitante" />
          </FormField>

          <FormField id="unResponsavel" label="Un. responsável (opcional)">
            <Input
              id="unResponsavel"
              name="unResponsavel"
              type="text"
              list="unidades-solicitante"
              autoComplete="off"
              disabled={isPending}
              placeholder="Unidade"
            />
            <datalist id="unidades-solicitante">
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
        <Button type="submit" form="adicionar-solicitante-form" loading={isPending}>
          {isPending ? "Adicionando..." : "Adicionar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
