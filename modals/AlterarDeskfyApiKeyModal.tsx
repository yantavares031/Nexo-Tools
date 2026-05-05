"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
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
          <h2 id={TITLE_ID} className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Plug className="size-5 shrink-0" aria-hidden />
            Alterar chave API Deskfy
          </h2>
        </Modal.Header>
        <Modal.Body as="div">
          <label htmlFor="deskfy-api-key-input" className="mb-1 block text-sm font-medium text-slate-600">
            Nova chave (x-api-key)
          </label>
          <input
            id="deskfy-api-key-input"
            name="apiKey"
            type="password"
            autoComplete="off"
            required
            placeholder="Cole a chave fornecida pela Deskfy"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <p className="mt-2 text-xs text-slate-500">
            A chave é armazenada no servidor e não é exibida após salvar.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <FormActionSubmitButton pending={isPendingKey} pendingLabel="Salvando...">
            Salvar chave
          </FormActionSubmitButton>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
