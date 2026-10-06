"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { updateDeskfyApiKeyAction } from "@/app/actions/deskfy-config";
import { Plug } from "lucide-react";
import { toast } from "sonner";

const TITLE_ID = "deskfy-api-key-modal-title";

interface AlterarDeskfyApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function AlterarDeskfyApiKeyModal({ open, onClose }: AlterarDeskfyApiKeyModalProps) {
  const router = useRouter();
  const [state, formAction, isPendingKey] = useActionState(updateDeskfyApiKeyAction, null);
  useToastOnActionError(state);

  useEffect(() => {
    if (state && !("error" in state) && Object.keys(state).length === 0) {
      toast.success("Chave API Deskfy atualizada.");
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} maxWidth="md" ariaLabelledby={TITLE_ID}>
      <form action={formAction}>
        <Modal.Header onClose={onClose}>
          <h2 id={TITLE_ID} className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
            <Plug className="size-5 shrink-0" aria-hidden />
            Alterar chave API Deskfy
          </h2>
        </Modal.Header>
        <Modal.Body as="div">
          <FormField
            id="deskfy-api-key-input"
            label="Nova chave (x-api-key)"
            hint="A chave é armazenada no servidor e não é exibida após salvar."
          >
            <Input
              id="deskfy-api-key-input"
              name="apiKey"
              type="password"
              autoComplete="off"
              required
              placeholder="Cole a chave fornecida pela Deskfy"
            />
          </FormField>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isPendingKey}>
            {isPendingKey ? "Salvando..." : "Salvar chave"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
