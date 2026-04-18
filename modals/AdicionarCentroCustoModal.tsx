"use client";

import { useState, useEffect, useActionState } from "react";
import { Check, Tag } from "lucide-react";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { createCentroCustoAction, updateCentroCustoAction, listCentrosCustoAction } from "@/app/actions/centro-custo";
import { Modal } from "@/components/Modal";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { useRouter } from "next/navigation";

interface AdicionarCentroCustoModalProps {
  open: boolean;
  onClose: () => void;
  centroCustoId?: string | null;
}

export function AdicionarCentroCustoModal({
  open,
  onClose,
  centroCustoId,
}: AdicionarCentroCustoModalProps) {
  const router = useRouter();
  const isEditing = !!centroCustoId;
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCentroCusto() {
      if (isEditing && centroCustoId) {
        setLoading(true);
        try {
          const result = await listCentrosCustoAction();
          const centroCusto = result.centrosCusto?.find((cc) => cc.id === centroCustoId);
          if (centroCusto) {
            setNome(centroCusto.nome);
          }
        } catch (error) {
          console.error("Erro ao carregar centro de custo:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setNome("");
      }
    }
    loadCentroCusto();
  }, [isEditing, centroCustoId]);

  const [state, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const nomeValue = (formData.get("nome") as string)?.trim();

      if (!nomeValue) {
        return { error: "O nome é obrigatório" };
      }

      if (isEditing && centroCustoId) {
        const result = await updateCentroCustoAction(centroCustoId, { nome: nomeValue });
        if (result.error) {
          return { error: result.error };
        }
        router.push("/centros-custo?updated=1");
        router.refresh();
        onClose();
        return { success: true };
      } else {
        const result = await createCentroCustoAction({ nome: nomeValue });
        if (result.error) {
          return { error: result.error };
        }
        router.push("/centros-custo?created=1");
        router.refresh();
        onClose();
        return { success: true };
      }
    },
    null
  );

  useToastOnActionError(state);

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="md"
      ariaLabelledby="modal-title"
      escapeEnabled={!isPending}
      closeOnOverlayClick={!isPending}
    >
      <Modal.Header onClose={onClose} closeDisabled={isPending}>
        <h2 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Tag className="size-5 shrink-0" />
          {isEditing ? "Editar centro de custo" : "Novo centro de custo"}
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="centro-custo-form" action={formAction}>
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
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading || isPending}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              placeholder="Ex: CC-001"
            />
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
          form="centro-custo-form"
          pending={isPending}
          pendingLabel={isEditing ? "Atualizando..." : "Criando..."}
          idleStart={<Check className="size-3.5 stroke-[2.5]" />}
        >
          {isEditing ? "Atualizar" : "Criar"}
        </FormActionSubmitButton>
      </Modal.Footer>
    </Modal>
  );
}
