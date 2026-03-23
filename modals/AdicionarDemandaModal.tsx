"use client";

import { useActionState, useRef, useCallback, useState } from "react";
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

interface AdicionarDemandaModalProps {
  open: boolean;
  onClose: () => void;
  options: DemandaFilterOptions;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      form="adicionar-demanda-form"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Adicionando...
        </>
      ) : (
        "Adicionar"
      )}
    </button>
  );
}

export function AdicionarDemandaModal({
  open,
  onClose,
  options,
}: AdicionarDemandaModalProps) {
  const [state, formAction] = useActionState(createDemandaAction, null);
  useToastOnActionError(state);
  const unResponsavelRef = useRef<HTMLInputElement>(null);
  const [centrosCusto, setCentrosCusto] = useState<DemandaCentroCusto[]>([]);
  const [valorTotal, setValorTotal] = useState(0);

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

  return (
    <Modal open={open} onClose={onClose} maxWidth="3xl" ariaLabelledby="modal-title">
      <Modal.Header onClose={onClose}>
        <h2 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Workflow className="size-5 shrink-0" />
          Nova demanda
        </h2>
      </Modal.Header>
      <Modal.Body
        as="form"
        id="adicionar-demanda-form"
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
        <div className="space-y-3">
          <div>
            <label
              htmlFor="demanda"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Demanda *
            </label>
            <input
              id="demanda"
              name="demanda"
              type="text"
              required
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              placeholder="Descrição da demanda"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label
                htmlFor="solicitante"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Solicitante *
              </label>
              <input
                id="solicitante"
                name="solicitante"
                type="text"
                list="solicitantes-list"
                required
                autoComplete="off"
                onChange={handleSolicitanteChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="Selecione ou digite"
              />
              <datalist id="solicitantes-list">
                {options.solicitantesComUnidade.map((s) => (
                  <option key={`${s.nome}-${s.unResponsavel}`} value={s.nome} />
                ))}
              </datalist>
            </div>
            <div>
              <label
                htmlFor="unResponsavel"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Un. Responsável *
              </label>
              <input
                ref={unResponsavelRef}
                id="unResponsavel"
                name="unResponsavel"
                type="text"
                list="unidades-list"
                required
                autoComplete="off"
                placeholder="Preenchido ao selecionar solicitante"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <datalist id="unidades-list">
                {options.unResponsaveis.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div>
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="comprometido">Comprometido</option>
                <option value="faturado">Faturado</option>
                <option value="entregue">Entregue</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="agencia"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Agência
              </label>
              <select
                id="agencia"
                name="agencia"
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

          <div>
            <label
              htmlFor="obs"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Observações
            </label>
            <input
              id="obs"
              name="obs"
              type="text"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label
                htmlFor="valor"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
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
              <label
                htmlFor="ocPi"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                OC/PI
              </label>
              <input
                id="ocPi"
                name="ocPi"
                type="text"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                placeholder="SEB-300114"
              />
            </div>
            <div>
              <label
                htmlFor="mes"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                Mês / Ano
              </label>
              <input
                id="mes"
                name="mes"
                type="month"
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
        <SubmitButton />
      </Modal.Footer>
    </Modal>
  );
}
