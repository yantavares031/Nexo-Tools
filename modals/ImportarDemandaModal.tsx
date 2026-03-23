"use client";

import { useActionState, useRef, useCallback, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Workflow } from "lucide-react";
import { createDemandaAction } from "@/app/actions/demanda";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { CurrencyInputControlled } from "@/components/CurrencyInputControlled";
import { Modal } from "@/components/Modal";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { DemandaCentrosCusto } from "./sub/DemandaCentrosCusto";
import type { DemandaCentroCusto } from "@/types/globals";
import { formatBrazilianCurrency } from "@/lib/currency";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";

interface ImportarDemandaModalProps {
  open: boolean;
  onClose: () => void;
  options: DemandaFilterOptions;
  initialData: DemandaImportadaPreview | null;
}

function getOcPiFromPreview(item: DemandaImportadaPreview): string {
  if (item.codigo?.trim().toUpperCase().startsWith("SEB-")) {
    return item.codigo.trim();
  }
  return `SEB-${item.id}`;
}

function ImportSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      form="importar-demanda-form"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Importando...
        </>
      ) : (
        "Importar"
      )}
    </button>
  );
}

export function ImportarDemandaModal({
  open,
  onClose,
  options,
  initialData,
}: ImportarDemandaModalProps) {
  const [state, formAction] = useActionState(createDemandaAction, null);
  useToastOnActionError(state);
  const unResponsavelRef = useRef<HTMLInputElement>(null);
  const [centrosCusto, setCentrosCusto] = useState<DemandaCentroCusto[]>([]);
  const [valorTotal, setValorTotal] = useState(0);

  const demanda = initialData?.demanda ?? "";
  const solicitante = initialData?.solicitante ?? "";
  const boardKey = initialData?.board?.trim() ?? "";
  const agenciaPreSelecionada = (boardKey && options.agenciaPorBoard?.[boardKey]) ?? "";
  const solicitanteEncontrado = solicitante
    ? options.solicitantesComUnidade.some(
        (s) => s.nome.toLowerCase() === solicitante.toLowerCase()
      )
    : false;
  const unResponsavel =
    options.solicitantesComUnidade.find(
      (s) => s.nome.toLowerCase() === solicitante.toLowerCase()
    )?.unResponsavel ?? "";
  const ocPi = initialData ? getOcPiFromPreview(initialData) : "";
  const mesYyyyMm = initialData?.mesYyyyMm ?? "";

  const handleSolicitanteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      const match = options.solicitantesComUnidade.find(
        (s) => s.nome.toLowerCase() === value.toLowerCase()
      );
      if (match && unResponsavelRef.current) {
        unResponsavelRef.current.value = match.unResponsavel;
      }
    },
    [options.solicitantesComUnidade]
  );

  useEffect(() => {
    if (open && unResponsavelRef.current && unResponsavel) {
      unResponsavelRef.current.value = unResponsavel;
    }
  }, [open, unResponsavel]);

  if (!initialData) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth="3xl" ariaLabelledby="importar-modal-title">
      <Modal.Header onClose={onClose}>
        <h2 id="importar-modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Workflow className="size-5 shrink-0" />
          Importar demanda
        </h2>
      </Modal.Header>
      <Modal.Body
        as="form"
        id="importar-demanda-form"
        key={initialData.id}
        action={async (formData: FormData) => {
          if (centrosCusto.length > 0) {
            const validCentros = centrosCusto.filter((cc) => cc.centroDeCusto && cc.valor > 0);
            formData.set(
              "centrosCusto",
              JSON.stringify(
                validCentros.map((cc) => ({
                  centroDeCusto: cc.centroDeCusto,
                  valor: cc.valor,
                  ordem: cc.ordem,
                }))
              )
            );
          }
          formAction(formData);
        }}
        className="max-h-[70vh] p-6"
      >
        <input type="hidden" name="redirectTo" value="importar" />
        <div className="space-y-3">
          <div>
            <label htmlFor="import-demanda" className="mb-1 block text-sm font-medium text-slate-600">
              Demanda *
            </label>
            <input
              id="import-demanda"
              name="demanda"
              type="text"
              required
              defaultValue={demanda}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              placeholder="Descrição da demanda"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label htmlFor="import-solicitante" className="mb-1 block text-sm font-medium text-slate-600">
                Solicitante *
              </label>
              <input
                id="import-solicitante"
                name="solicitante"
                type="text"
                list="import-solicitantes-list"
                required
                autoComplete="off"
                defaultValue={solicitante}
                onChange={handleSolicitanteChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="Selecione ou digite"
              />
              <datalist id="import-solicitantes-list">
                {options.solicitantesComUnidade.map((s) => (
                  <option key={`${s.nome}-${s.unResponsavel}`} value={s.nome} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="import-unResponsavel" className="mb-1 block text-sm font-medium text-slate-600">
                Un. Responsável *
              </label>
              <input
                ref={unResponsavelRef}
                id="import-unResponsavel"
                name="unResponsavel"
                type="text"
                list="import-unidades-list"
                required
                autoComplete="off"
                defaultValue={unResponsavel}
                placeholder="Preenchido ao selecionar solicitante"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <datalist id="import-unidades-list">
                {options.unResponsaveis.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="import-status" className="mb-1 block text-sm font-medium text-slate-600">
                Status
              </label>
              <select
                id="import-status"
                name="status"
                defaultValue="entregue"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="comprometido">Comprometido</option>
                <option value="faturado">Faturado</option>
                <option value="entregue">Entregue</option>
              </select>
            </div>
            <div>
              <label htmlFor="import-agencia" className="mb-1 block text-sm font-medium text-slate-600">
                Agência
              </label>
              <select
                id="import-agencia"
                name="agencia"
                defaultValue={agenciaPreSelecionada}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Selecione</option>
                {options.agencias.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {solicitante && !solicitanteEncontrado && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              Não encontramos o solicitante <strong>{solicitante}</strong> cadastrado no sistema.
            </div>
          )}

          <div>
            <label htmlFor="import-obs" className="mb-1 block text-sm font-medium text-slate-600">
              Observações
            </label>
            <input
              id="import-obs"
              name="obs"
              type="text"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label htmlFor="import-valor" className="mb-1 block text-sm font-medium text-slate-600">
                Valor (R$)
              </label>
              <div className="relative">
                <CurrencyInputControlled
                  value={valorTotal}
                  onChange={(valor) => setValorTotal(valor)}
                />
                <input
                  type="hidden"
                  name="valor"
                  value={formatBrazilianCurrency(valorTotal)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="import-ocPi" className="mb-1 block text-sm font-medium text-slate-600">
                OC/PI
              </label>
              <input
                id="import-ocPi"
                name="ocPi"
                type="text"
                defaultValue={ocPi}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="SEB-300114"
              />
            </div>
            <div>
              <label htmlFor="import-mes" className="mb-1 block text-sm font-medium text-slate-600">
                Mês / Ano
              </label>
              <input
                id="import-mes"
                name="mes"
                type="month"
                defaultValue={mesYyyyMm}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {valorTotal > 0 && (
            <DemandaCentrosCusto
              demandaId=""
              valorTotal={valorTotal}
              readOnly={false}
              onChange={setCentrosCusto}
            />
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <ImportSubmitButton />
      </Modal.Footer>
    </Modal>
  );
}
