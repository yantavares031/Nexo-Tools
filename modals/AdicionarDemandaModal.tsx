"use client";

import { useActionState, useRef, useCallback, useState } from "react";
import { Workflow } from "lucide-react";
import { createDemandaAction } from "@/app/actions/demanda";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { CurrencyInputControlled } from "@/components/CurrencyInputControlled";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { DemandaCentrosCusto } from "./sub/DemandaCentrosCusto";
import type { DemandaCentroCusto } from "@/types/globals";
import { formatBrazilianCurrency } from "@/lib/currency";

interface AdicionarDemandaModalProps {
  open: boolean;
  onClose: () => void;
  options: DemandaFilterOptions;
}

export function AdicionarDemandaModal({
  open,
  onClose,
  options,
}: AdicionarDemandaModalProps) {
  const [state, formAction, isPending] = useActionState(createDemandaAction, null);
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
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="3xl"
      ariaLabelledby="modal-title"
      escapeEnabled={!isPending}
      closeOnOverlayClick={!isPending}
    >
      <Modal.Header onClose={onClose} closeDisabled={isPending}>
        <h2 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
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
        <div
          className={`space-y-3 ${isPending ? "pointer-events-none opacity-60" : ""}`}
          aria-busy={isPending}
        >
          <div>
            <Label
              htmlFor="demanda" className="mb-1.5"
            >
              Demanda *
            </Label>
            <Input
              id="demanda"
              name="demanda"
              type="text"
              required
              placeholder="Descrição da demanda"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label
                htmlFor="solicitante" className="mb-1.5"
              >
                Solicitante *
              </Label>
              <Input
                id="solicitante"
                name="solicitante"
                type="text"
                list="solicitantes-list"
                required
                autoComplete="off"
                onChange={handleSolicitanteChange}
                placeholder="Selecione ou digite"
              />
              <datalist id="solicitantes-list">
                {options.solicitantesComUnidade.map((s) => (
                  <option key={`${s.nome}-${s.unResponsavel}`} value={s.nome} />
                ))}
              </datalist>
            </div>
            <div>
              <Label
                htmlFor="unResponsavel" className="mb-1.5"
              >
                Un. Responsável *
              </Label>
              <Input
                ref={unResponsavelRef}
                id="unResponsavel"
                name="unResponsavel"
                type="text"
                list="unidades-list"
                required
                autoComplete="off"
                placeholder="Preenchido ao selecionar solicitante"
              />
              <datalist id="unidades-list">
                {options.unResponsaveis.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div>
              <Label
                htmlFor="status" className="mb-1.5"
              >
                Status
              </Label>
              <Select
                id="status"
                name="status" className="w-full"
              >
                <option value="comprometido">Comprometido</option>
                <option value="faturado">Faturado</option>
                <option value="entregue">Entregue</option>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="agencia" className="mb-1.5"
              >
                Agência
              </Label>
              <Select
                id="agencia"
                name="agencia" className="w-full"
              >
                <option value="">Selecione</option>
                {options.agencias.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label
              htmlFor="obs" className="mb-1.5"
            >
              Observações
            </Label>
            <Input
              id="obs"
              name="obs"
              type="text"
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label
                htmlFor="valor" className="mb-1.5"
              >
                Valor (R$)
              </Label>
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
              <Label
                htmlFor="ocPi" className="mb-1.5"
              >
                OC/PI
              </Label>
              <Input
                id="ocPi"
                name="ocPi"
                type="text"
                placeholder="SEB-300114"
              />
            </div>
            <div>
              <Label
                htmlFor="mes" className="mb-1.5"
              >
                Mês / Ano
              </Label>
              <Input
                id="mes"
                name="mes"
                type="month"
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
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" form="adicionar-demanda-form" loading={isPending}>
          {isPending ? "Adicionando..." : "Adicionar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
