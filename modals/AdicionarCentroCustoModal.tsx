"use client";

import { useState, useEffect, useActionState } from "react";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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
        <h2 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <Tag className="size-5 shrink-0" />
          {isEditing ? "Editar centro de custo" : "Novo centro de custo"}
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="centro-custo-form" action={formAction}>
        <div className="space-y-4">
          <FormField id="nome" label="Nome *">
            <Input
              id="nome"
              name="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading || isPending}
              placeholder="Ex: CC-001"
            />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" form="centro-custo-form" loading={isPending}>
          {isPending ? (
            isEditing ? "Atualizando..." : "Criando..."
          ) : (
            <>
              <Check className="size-3.5 stroke-[2.5]" aria-hidden />
              {isEditing ? "Atualizar" : "Criar"}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
