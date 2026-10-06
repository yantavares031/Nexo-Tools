"use client";

import { useActionState } from "react";
import { Megaphone } from "lucide-react";
import { createAgenciaAction } from "@/app/actions/agencia";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export function AdicionarAgenciaModal({
  open,
  onClose,
  boards = [],
}: AdicionarAgenciaModalProps) {
  const [state, formAction, isPending] = useActionState(createAgenciaAction, null);
  useToastOnActionError(state);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      ariaLabelledby="modal-agencia-title"
      escapeEnabled={!isPending}
      closeOnOverlayClick={!isPending}
    >
      <Modal.Header onClose={onClose} closeDisabled={isPending}>
        <h2 id="modal-agencia-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <Megaphone className="size-5 shrink-0" />
          Nova agência
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="adicionar-agencia-form" action={formAction}>
        <div className="space-y-4">
          <FormField id="nomeFantasia" label="Nome fantasia *">
            <Input
              id="nomeFantasia"
              name="nomeFantasia"
              type="text"
              required
              disabled={isPending}
              placeholder="Ex: La Marka"
            />
          </FormField>

          <FormField id="cnpj" label="CNPJ *">
            <Input
              id="cnpj"
              name="cnpj"
              type="text"
              required
              disabled={isPending}
              placeholder="00.000.000/0001-00"
            />
          </FormField>

          <FormField id="orcamentoAnual" label="Limite orçamento anual (R$)">
            <CurrencyInput id="orcamentoAnual" name="orcamentoAnual" defaultValue={0} disabled={isPending} />
          </FormField>

          {boards.length > 0 ? (
            <FormField id="boardId" label="Board Deskfy">
              <Select id="boardId" name="boardId" disabled={isPending} className="w-full">
                <option value="">Nenhum</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" form="adicionar-agencia-form" loading={isPending}>
          {isPending ? "Adicionando..." : "Adicionar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
