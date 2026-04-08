"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Upload, Search, X, FileText } from "lucide-react";
import type { Demanda } from "@/types/globals";
import { createOrdemCompraAction } from "@/app/actions/ordem-compra";
import { toast } from "sonner";
import { formatMonthYearDisplay } from "@/lib/month-year";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

const STATUS_COLORS: Record<string, string> = {
  faturado: "bg-emerald-100 text-emerald-800",
  comprometido: "bg-amber-100 text-amber-800",
  entregue: "bg-slate-100 text-slate-800",
};

const MAX_FILE_SIZE_MB = 10;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface AddOrdemCompraFormProps {
  demandas: Demanda[];
  mesOptions: { value: string; label: string }[];
  defaultMes: string;
  defaultSearch: string;
}

export function AddOrdemCompraForm({
  demandas,
  mesOptions,
  defaultMes,
  defaultSearch,
}: AddOrdemCompraFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState(defaultSearch);
  const [mes, setMes] = useState(defaultMes);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMes(defaultMes);
    setSearch(defaultSearch);
  }, [defaultMes, defaultSearch]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", mes);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    router.push(`/ordens-compra/adicionar?${params.toString()}`);
  }, [mes, search, router, searchParams]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  };

  const canSubmit = Boolean(selectedId && file);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId) {
      toast.error("Selecione uma demanda.");
      return;
    }
    if (!file) {
      toast.error("Envie o documento PDF da OC.");
      return;
    }
    const formData = new FormData();
    formData.append("demandaId", selectedId);
    formData.append("file", file);
    setIsSubmitting(true);
    try {
      const result = await createOrdemCompraAction(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Pedido de assinatura de OC enviado com sucesso!");
        setFile(null);
        setSelectedId(null);
        router.push("/ordens-compra");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="order-2 lg:order-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 transition duration-200">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  1
                </span>
                Documento da OC (PDF)
              </h3>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
                  isDragging
                    ? "scale-[1.02] border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  className={`mb-3 rounded-2xl p-4 transition ${isDragging ? "bg-blue-100" : "bg-slate-100"}`}
                >
                  <Upload className={`size-10 ${isDragging ? "text-blue-600" : "text-slate-500"}`} />
                </div>
                <p className="text-center text-sm font-medium text-slate-700">
                  {isDragging ? "Solte o PDF aqui" : "Clique ou arraste o PDF"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Apenas PDF, até {MAX_FILE_SIZE_MB}MB</p>
              </div>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <FileText className="size-5 shrink-0 text-blue-600" />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                    aria-label="Remover arquivo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {selectedId ? "1 demanda" : "Nenhuma demanda"} • {file ? "1 arquivo" : "Nenhum arquivo"}
                </span>
                {canSubmit && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Pronto para enviar
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Enviar pedido de assinatura
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                2
              </span>
              Selecione a demanda
            </h3>

            <div className="mb-4 flex flex-wrap gap-2">
              <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyFilters();
                    }
                  }}
                  placeholder="Buscar demanda..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
              >
                {mesOptions.map((opt) => (
                  <option key={opt.value || "todos"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Filtrar
              </button>
            </div>

            {demandas.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nenhuma demanda encontrada. Ajuste os filtros.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-slate-600">
                  {demandas.length}{" "}
                  {demandas.length === 1 ? "demanda encontrada" : "demandas encontradas"}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demandas.map((d) => {
                    const isSelected = selectedId === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedId(d.id)}
                        className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800" title={d.demanda}>
                            {d.demanda}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono">{d.ocPi || "—"}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[d.status] ?? ""}`}
                            >
                              {STATUS_LABELS[d.status] ?? d.status}
                            </span>
                            <span>{formatMonthYearDisplay(d.mes)}</span>
                            <span className="font-medium text-slate-700">{formatCurrency(d.valor)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
