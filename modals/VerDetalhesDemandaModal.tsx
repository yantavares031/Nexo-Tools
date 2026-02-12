"use client";

import { useState, useActionState, useRef, useCallback, useEffect, useTransition } from "react";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useFormStatus } from "react-dom";
import { X, Check, CircleMinus, Workflow } from "lucide-react";
import { updateDemandaAction, removeDemandaAction } from "@/app/actions/demanda";
import type { Demanda } from "@/types/globals";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { CurrencyInput } from "@/components/CurrencyInput";
import { parseBrazilianCurrency, formatBrazilianCurrency } from "@/lib/currency";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { useConfirm } from "@/lib/confirm-context";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface VerDetalhesDemandaModalProps {
  demanda: Demanda | null;
  options: DemandaFilterOptions;
  open: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Salvando...
        </>
      ) : (
        <>
          <Check className="size-3.5 stroke-[2.5]" />
          Salvar
        </>
      )}
    </button>
  );
}

type EditField = string | null;

export function VerDetalhesDemandaModal({
  demanda,
  options,
  open,
  onClose,
  readOnly = false,
}: VerDetalhesDemandaModalProps) {
  const [isPendingRemove, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const [state, formAction] = useActionState(
    updateDemandaAction.bind(null, demanda?.id ?? ""),
    null
  );
  useToastOnActionError(state);
  const unResponsavelRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [editingField, setEditingField] = useState<EditField>(null);
  const [values, setValues] = useState<{
    demanda: string;
    solicitante: string;
    unResponsavel: string;
    obs: string;
    status: "faturado" | "comprometido";
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

  useEscapeKey(onClose, open && !isPendingRemove);

  const handleSolicitanteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      const match = options.solicitantesComUnidade.find(
        (s) => s.nome.toLowerCase() === value.toLowerCase()
      );
      if (match) {
        setValues((v) => ({ ...v, unResponsavel: match.unResponsavel }));
        if (unResponsavelRef.current) {
          unResponsavelRef.current.value = match.unResponsavel;
        }
      }
    },
    [options.solicitantesComUnidade]
  );

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

  const textClass = readOnly
    ? "rounded px-2 py-1 text-sm text-slate-800"
    : "cursor-pointer rounded px-2 py-1 text-sm text-slate-800 hover:bg-slate-50";
  const valorTextClass = readOnly
    ? "rounded px-2 py-1 text-sm font-bold text-emerald-600"
    : "cursor-pointer rounded px-2 py-1 text-sm font-bold text-emerald-600 hover:bg-slate-50";
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400";

  const statusBadgeClass =
    values.status === "faturado"
      ? "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
      : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800";

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] min-w-full items-center justify-center p-4">
      <div
        className="absolute inset-0 min-h-[100dvh] min-w-full bg-black/40"
        onClick={isPendingRemove ? () => {} : onClose}
        aria-hidden
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="modal-detalhes-title"
        aria-modal
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-3">
          <h2 id="modal-detalhes-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Workflow className="size-5 shrink-0" />
            Detalhes da demanda
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPendingRemove}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          ref={formRef}
          action={formAction}
          className="flex max-h-[70vh] flex-1 flex-col overflow-hidden"
        >
          <div className="overflow-y-auto p-6">
            <div className="space-y-3">
              <div className="group">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Demanda *
                </span>
                {!readOnly && editingField === "demanda" ? (
                  <input
                    name="demanda"
                    required
                    value={values.demanda}
                    onChange={(e) => setValues((v) => ({ ...v, demanda: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className={inputClass}
                  />
                ) : (
                  <>
                    {!readOnly && <input type="hidden" name="demanda" value={values.demanda} />}
                    <div
                      onClick={readOnly ? undefined : () => setEditingField("demanda")}
                      className={textClass}
                    >
                      {values.demanda || "—"}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Solicitante *
                  </span>
                  {!readOnly && editingField === "solicitante" ? (
                    <>
                      <input
                        name="solicitante"
                        required
                        list="solicitantes-list-edit"
                        autoComplete="off"
                        value={values.solicitante}
                        onChange={(e) => {
                          setValues((v) => ({ ...v, solicitante: e.target.value }));
                          handleSolicitanteChange(e);
                        }}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className={inputClass}
                      />
                      <datalist id="solicitantes-list-edit">
                        {options.solicitantesComUnidade.map((s) => (
                          <option key={`${s.nome}-${s.unResponsavel}`} value={s.nome} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="solicitante" value={values.solicitante} />}
                      <div onClick={readOnly ? undefined : () => setEditingField("solicitante")} className={textClass}>
                        {values.solicitante || "—"}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Un. Responsável *
                  </span>
                  {!readOnly && editingField === "unResponsavel" ? (
                    <>
                      <input
                        ref={unResponsavelRef}
                        name="unResponsavel"
                        required
                        list="unidades-list-edit"
                        autoComplete="off"
                        value={values.unResponsavel}
                        onChange={(e) => setValues((v) => ({ ...v, unResponsavel: e.target.value }))}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className={inputClass}
                      />
                      <datalist id="unidades-list-edit">
                        {options.unResponsaveis.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="unResponsavel" value={values.unResponsavel} />}
                      <div onClick={readOnly ? undefined : () => setEditingField("unResponsavel")} className={textClass}>
                        {values.unResponsavel || "—"}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Status
                  </span>
                  {!readOnly && editingField === "status" ? (
                    <select
                      name="status"
                      value={values.status}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, status: e.target.value as "faturado" | "comprometido" }))
                      }
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                    >
                      <option value="comprometido">Comprometido</option>
                      <option value="faturado">Faturado</option>
                    </select>
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="status" value={values.status} />}
                      <div
                        onClick={readOnly ? undefined : () => setEditingField("status")}
                        className={
                          readOnly
                            ? `rounded px-2 py-1 ${statusBadgeClass}`
                            : `cursor-pointer rounded px-2 py-1 hover:bg-slate-50 ${statusBadgeClass}`
                        }
                      >
                        {STATUS_LABELS[values.status] ?? values.status}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Agência
                  </span>
                  {!readOnly && editingField === "agencia" ? (
                    <select
                      name="agencia"
                      value={values.agencia}
                      onChange={(e) => setValues((v) => ({ ...v, agencia: e.target.value }))}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                    >
                      <option value="">Selecione</option>
                      {options.agencias.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="agencia" value={values.agencia} />}
                      <div
                        onClick={readOnly ? undefined : () => setEditingField("agencia")}
                        className={
                          values.agencia
                            ? readOnly
                              ? "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                              : "cursor-pointer inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            : textClass
                        }
                      >
                        {values.agencia || "—"}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="group">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Observações
                </span>
                {!readOnly && editingField === "obs" ? (
                  <input
                    name="obs"
                    value={values.obs}
                    onChange={(e) => setValues((v) => ({ ...v, obs: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className={inputClass}
                  />
                ) : (
                  <>
                    {!readOnly && <input type="hidden" name="obs" value={values.obs} />}
                    <div onClick={readOnly ? undefined : () => setEditingField("obs")} className={textClass}>
                      {values.obs || "—"}
                    </div>
                  </>
                )}
              </div>

              <div className="group">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Centro de custo
                </span>
                {!readOnly && editingField === "centroDeCusto" ? (
                  <input
                    name="centroDeCusto"
                    value={values.centroDeCusto}
                    onChange={(e) => setValues((v) => ({ ...v, centroDeCusto: e.target.value }))}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className={inputClass}
                  />
                ) : (
                  <>
                    {!readOnly && <input type="hidden" name="centroDeCusto" value={values.centroDeCusto} />}
                    <div
                      onClick={readOnly ? undefined : () => setEditingField("centroDeCusto")}
                      className={`${textClass} min-w-0 overflow-hidden text-ellipsis whitespace-nowrap`}
                      title={values.centroDeCusto || undefined}
                    >
                      {values.centroDeCusto || "—"}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Valor (R$)
                  </span>
                  {!readOnly && editingField === "valor" ? (
                    <div
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          const inp = formRef.current?.elements.namedItem("valor") as HTMLInputElement | undefined;
                          if (inp?.value) {
                            setValues((v) => ({ ...v, valor: parseBrazilianCurrency(inp.value) }));
                          }
                          setEditingField(null);
                        }
                      }}
                    >
                      <CurrencyInput
                        name="valor"
                        defaultValue={values.valor}
                        key="valor-edit"
                      />
                    </div>
                  ) : (
                    <>
                      {!readOnly && (
                        <input
                          type="hidden"
                          name="valor"
                          value={formatBrazilianCurrency(values.valor)}
                        />
                      )}
                      <div onClick={readOnly ? undefined : () => setEditingField("valor")} className={valorTextClass}>
                        {formatCurrency(values.valor)}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    OC/PI
                  </span>
                  {!readOnly && editingField === "ocPi" ? (
                    <input
                      name="ocPi"
                      value={values.ocPi}
                      onChange={(e) => setValues((v) => ({ ...v, ocPi: e.target.value }))}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={`${inputClass} font-mono`}
                    />
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="ocPi" value={values.ocPi} />}
                      <div
                        onClick={readOnly ? undefined : () => setEditingField("ocPi")}
                        className={
                          values.ocPi
                            ? readOnly
                              ? "font-mono inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                              : "cursor-pointer font-mono inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            : `${textClass} font-mono`
                        }
                      >
                        {values.ocPi || "—"}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Mês
                  </span>
                  {!readOnly && editingField === "mes" ? (
                    <input
                      name="mes"
                      value={values.mes}
                      onChange={(e) => setValues((v) => ({ ...v, mes: e.target.value }))}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                    />
                  ) : (
                    <>
                      {!readOnly && <input type="hidden" name="mes" value={values.mes} />}
                      <div onClick={readOnly ? undefined : () => setEditingField("mes")} className={textClass}>
                        {values.mes || "—"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-3">
              <SubmitButton />
              <button
                type="button"
                onClick={handleRemover}
                disabled={isPendingRemove}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPendingRemove ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <CircleMinus className="size-3.5 stroke-[2.5]" />
                    Remover
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
