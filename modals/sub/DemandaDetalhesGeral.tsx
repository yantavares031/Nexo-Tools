"use client";

import { useState, useRef, useCallback } from "react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { parseBrazilianCurrency, formatBrazilianCurrency } from "@/lib/currency";
import { formatMonthYearDisplay, parseMonthYearToInput } from "@/lib/month-year";
import type { Demanda } from "@/types/globals";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  faturado: "success",
  comprometido: "warning",
  entregue: "info",
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
    ? "-mx-2 rounded-field px-2 py-1.5 text-sm text-neutral-800"
    : "-mx-2 cursor-pointer rounded-field px-2 py-1.5 text-sm text-neutral-800 transition-colors hover:bg-neutral-50";
  const valorTextClass = `${textClass} font-semibold tabular-nums text-neutral-950`;
  const inputClass = cn("block w-full", inputClassName);
  const fieldLabelClass = "mb-1 block text-[11px] font-medium tracking-wide text-neutral-400 uppercase";

  return (
    <div className="space-y-3">
      <div className="group">
        <span className={fieldLabelClass}>Demanda *</span>
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
          <span className={fieldLabelClass}>Solicitante *</span>
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
          <span className={fieldLabelClass}>Un. Responsável *</span>
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
          <span className={fieldLabelClass}>Status</span>
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
              <div onClick={readOnly ? undefined : () => setEditingField("status")} className={textClass}>
                <Badge tone={STATUS_TONES[values.status] ?? "neutral"}>
                  {STATUS_LABELS[values.status] ?? values.status}
                </Badge>
              </div>
            </>
          )}
        </div>
        <div className="group">
          <span className={fieldLabelClass}>Agência</span>
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
                className={cn(textClass, values.agencia && "truncate text-link")}
                title={values.agencia || undefined}
              >
                {values.agencia || "—"}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="group">
        <span className={fieldLabelClass}>Observações</span>
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
          <span className={fieldLabelClass}>Valor (R$)</span>
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
          <span className={fieldLabelClass}>OC/PI</span>
          {!readOnly && editingField === "ocPi" ? (
            <input
              name="ocPi"
              value={values.ocPi}
              onChange={(e) => setValues((v) => ({ ...v, ocPi: e.target.value }))}
              onBlur={() => setEditingField(null)}
              autoFocus
              className={cn(inputClass, "tabular-nums")}
            />
          ) : (
            <>
              {!readOnly && <input type="hidden" name="ocPi" value={values.ocPi} />}
              <div
                onClick={readOnly ? undefined : () => setEditingField("ocPi")}
                className={cn(textClass, "tabular-nums")}
              >
                {values.ocPi || "—"}
              </div>
            </>
          )}
        </div>
        <div className="group">
          <span className={fieldLabelClass}>Mês / Ano</span>
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

      <div className="border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        Criado em <span className="tabular-nums">{formatDateTime(demanda.createdAt)}</span>
      </div>
    </div>
  );
}
