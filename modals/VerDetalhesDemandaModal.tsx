"use client";

import { useState, useActionState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, CircleMinus, FileSignature, History, Workflow } from "lucide-react";
import { updateDemandaAction, removeDemandaAction } from "@/app/actions/demanda";
import type { Demanda } from "@/types/globals";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { useConfirm } from "@/components/confirm-provider";
import { DemandaComprovacoes } from "./sub/DemandaComprovacoes";
import { DemandaCentrosCusto } from "./sub/DemandaCentrosCusto";
import { DemandaDetalhesGeral } from "./sub/DemandaDetalhesGeral";
import { DemandaOrdemCompra } from "./sub/DemandaOrdemCompra";
import { DemandaHistoricoTimeline } from "./sub/DemandaHistoricoTimeline";
import { Tab } from "@/components/Tab";
import { Modal } from "@/components/Modal";
import type { UserRole } from "@/types/globals";

interface VerDetalhesDemandaModalProps {
  demanda: Demanda | null;
  options: DemandaFilterOptions;
  open: boolean;
  onClose: () => void;
  readOnly?: boolean;
  userRole?: UserRole;
}

export function VerDetalhesDemandaModal({
  demanda,
  options,
  open,
  onClose,
  readOnly = false,
  userRole = "operator",
}: VerDetalhesDemandaModalProps) {
  const [isPendingRemove, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const [state, formAction, isPendingSave] = useActionState(
    updateDemandaAction.bind(null, demanda?.id ?? ""),
    null
  );
  useToastOnActionError(state);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [values, setValues] = useState<{
    demanda: string;
    solicitante: string;
    unResponsavel: string;
    obs: string;
    status: "faturado" | "comprometido" | "entregue";
    valor: number;
    centroDeCusto: string;
    ocPi: string;
    mes: string;
    agencia: string;
  }>({
    demanda: "",
    solicitante: "",
    unResponsavel: "",
    obs: "",
    status: "comprometido",
    valor: 0,
    centroDeCusto: "",
    ocPi: "",
    mes: "",
    agencia: "",
  });

  useEffect(() => {
    if (demanda) {
      setValues({
        demanda: demanda.demanda,
        solicitante: demanda.solicitante,
        unResponsavel: demanda.unResponsavel,
        obs: demanda.obs,
        status: demanda.status,
        valor: demanda.valor,
        centroDeCusto: demanda.centroDeCusto,
        ocPi: demanda.ocPi,
        mes: demanda.mes,
        agencia: demanda.agencia ?? "",
      });
    }
  }, [demanda]);

  async function handleRemover() {
    if (!demanda) return;
    const ok = await confirm({
      title: "Remover demanda",
      message: "Deseja realmente remover esta demanda?",
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeDemandaAction(demanda.id);
    });
  }

  if (!open || !demanda) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="5xl"
      ariaLabelledby="modal-detalhes-title"
      escapeEnabled={!isPendingRemove && !isPreviewOpen && !isPendingSave}
      closeOnOverlayClick={!isPendingRemove && !isPendingSave}
      innerClassName="flex max-h-[90vh] flex-col overflow-hidden"
    >
      <Modal.Header onClose={onClose} closeDisabled={isPendingRemove || isPendingSave}>
        <h2 id="modal-detalhes-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <Workflow className="size-5 shrink-0" />
          Detalhes da demanda
        </h2>
      </Modal.Header>
      <form
        ref={formRef}
        action={formAction}
        className="flex max-h-[70vh] flex-1 flex-col overflow-hidden"
      >
        <div className="overflow-y-auto p-4 sm:p-6">
          <Tab defaultTab="geral">
            <Tab.List>
              <Tab.Item id="geral">Geral</Tab.Item>
              <Tab.Item id="centros-custo">Centros de Custo</Tab.Item>
              <Tab.Item id="comprovacoes">Comprovações / Notas Fiscais</Tab.Item>
              <Tab.Item id="ordem-compra">
                <span className="flex items-center gap-1.5">
                  <FileSignature className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
                  Ordem de compra
                </span>
              </Tab.Item>
              <Tab.Item id="historico">
                <span className="flex items-center gap-1.5">
                  <History className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
                  Histórico
                </span>
              </Tab.Item>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel id="geral">
                <DemandaDetalhesGeral
                  demanda={demanda}
                  options={options}
                  readOnly={readOnly}
                  formRef={formRef}
                  values={values}
                  setValues={setValues}
                />
              </Tab.Panel>
              <Tab.Panel id="centros-custo">
                <DemandaCentrosCusto
                  demandaId={demanda.id}
                  valorTotal={values.valor}
                  readOnly={true}
                />
              </Tab.Panel>
              <Tab.Panel id="comprovacoes">
                <DemandaComprovacoes
                  demandaId={demanda.id}
                  userRole={userRole}
                  onPreviewOpenChange={setIsPreviewOpen}
                />
              </Tab.Panel>
              <Tab.Panel id="ordem-compra">
                <DemandaOrdemCompra demanda={demanda} demandaId={demanda.id} />
              </Tab.Panel>
              <Tab.Panel id="historico">
                <DemandaHistoricoTimeline demandaId={demanda.id} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab>
        </div>
        {!readOnly && (
          <Modal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemover}
              disabled={isPendingSave}
              loading={isPendingRemove}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              {isPendingRemove ? (
                "Removendo..."
              ) : (
                <>
                  <CircleMinus className="size-3.5 stroke-[2.5]" aria-hidden />
                  Remover
                </>
              )}
            </Button>
            <Button type="submit" loading={isPendingSave}>
              {isPendingSave ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                  Salvar
                </>
              )}
            </Button>
          </Modal.Footer>
        )}
      </form>
    </Modal>
  );
}
