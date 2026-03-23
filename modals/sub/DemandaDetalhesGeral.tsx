"use client";

import { useState, useRef, useCallback } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { parseBrazilianCurrency, formatBrazilianCurrency } from "@/lib/currency";
import { formatMonthYearDisplay, parseMonthYearToInput } from "@/lib/month-year";
import type { Demanda } from "@/types/globals";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

interface DemandaDetalhesGeralProps {
  demanda: Demanda;
  options: DemandaFilterOptions;
  readOnly?: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
  values: {
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
  };
  setValues: React.Dispatch<
    React.SetStateAction<{
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
    }>
  >;
}

type EditField = string | null;

export function DemandaDetalhesGeral({
  demanda,
  options,
  readOnly = false,
  formRef,
  values,
  setValues,
}: DemandaDetalhesGeralProps) {
  const unResponsavelRef = useRef<HTMLInputElement>(null);
  const [editingField, setEditingField] = useState<EditField>(null);

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
    [options.solicitantesComUnidade, setValues]
  );

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
      : values.status === "entregue"
        ? "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"
        : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800";

  return (
    <div className="space-y-3">
      <div className="group">
        <span className="mb-1 block text-xs font-medium text-slate-500">Demanda *</span>
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
            <div onClick={readOnly ? undefined : () => setEditingField("demanda")} className={textClass}>
              {values.demanda || "—"}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="group">
          <span className="mb-1 block text-xs font-medium text-slate-500">Solicitante *</span>
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
          <span className="mb-1 block text-xs font-medium text-slate-500">Un. Responsável *</span>
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
          <span className="mb-1 block text-xs font-medium text-slate-500">Status</span>
          {!readOnly && editingField === "status" ? (
            <select
              name="status"
              value={values.status}
              onChange={(e) =>
                setValues((v) => ({ ...v, status: e.target.value as "faturado" | "comprometido" | "entregue" }))
              }
              onBlur={() => setEditingField(null)}
              autoFocus
              className={inputClass}
            >
              <option value="comprometido">Comprometido</option>
              <option value="faturado">Faturado</option>
              <option value="entregue">Entregue</option>
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
          <span className="mb-1 block text-xs font-medium text-slate-500">Agência</span>
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
        <span className="mb-1 block text-xs font-medium text-slate-500">Observações</span>
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="group">
          <span className="mb-1 block text-xs font-medium text-slate-500">Valor (R$)</span>
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
              <CurrencyInput name="valor" defaultValue={values.valor} key="valor-edit" />
            </div>
          ) : (
            <>
              {!readOnly && (
                <input type="hidden" name="valor" value={formatBrazilianCurrency(values.valor)} />
              )}
              <div onClick={readOnly ? undefined : () => setEditingField("valor")} className={valorTextClass}>
                {formatCurrency(values.valor)}
              </div>
            </>
          )}
        </div>
        <div className="group">
          <span className="mb-1 block text-xs font-medium text-slate-500">OC/PI</span>
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
          <span className="mb-1 block text-xs font-medium text-slate-500">Mês / Ano</span>
          {!readOnly && editingField === "mes" ? (
            <input
              name="mes"
              type="month"
              value={parseMonthYearToInput(values.mes)}
              onChange={(e) => setValues((v) => ({ ...v, mes: e.target.value || "" }))}
              onBlur={() => setEditingField(null)}
              autoFocus
              className={inputClass}
            />
          ) : (
            <>
              {!readOnly && <input type="hidden" name="mes" value={values.mes} />}
              <div onClick={readOnly ? undefined : () => setEditingField("mes")} className={textClass}>
                {formatMonthYearDisplay(values.mes)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3">
        <div className="text-sm text-blue-600">
          <span className="font-semibold">Criado em:</span> {formatDateTime(demanda.createdAt)}
        </div>
      </div>
    </div>
  );
}
