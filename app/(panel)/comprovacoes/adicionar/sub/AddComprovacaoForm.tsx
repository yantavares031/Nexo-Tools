"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Upload, Search, X, FileText, Image, FileSpreadsheet } from "lucide-react";
import type { Demanda } from "@/types/globals";
import { createComprovacaoAction } from "@/app/actions/demanda-comprovacao";
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

const ALLOWED_EXTENSIONS = "PDF, XML, TXT, DOCX, DOC, XLSX, XLS, JPG, JPEG, PNG";
const MAX_FILE_SIZE_MB = 10;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png"].includes(ext)) return <Image className="size-5 text-pink-500" />;
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className="size-5 text-emerald-600" />;
  return <FileText className="size-5 text-blue-600" />;
}

interface AddComprovacaoFormProps {
  demandas: Demanda[];
  mesOptions: { value: string; label: string }[];
  defaultMes: string;
  defaultSearch: string;
}

export function AddComprovacaoForm({
  demandas,
  mesOptions,
  defaultMes,
  defaultSearch,
}: AddComprovacaoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(defaultSearch);
  const [mes, setMes] = useState(defaultMes);
  const [files, setFiles] = useState<File[]>([]);
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
    params.delete("page");
    router.push(`/comprovacoes/adicionar?${params.toString()}`);
  }, [mes, search, router, searchParams]);

  const allSelected = demandas.length > 0 && selectedIds.size === demandas.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(demandas.map((d) => d.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const selectedDemandas = demandas.filter((d) => selectedIds.has(d.id));
  const canSubmit = selectedIds.size > 0 && files.length > 0;

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos uma demanda.");
      return;
    }
    if (files.length === 0) {
      toast.error("Adicione pelo menos um arquivo.");
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData();
    selectedIds.forEach((id) => formData.append("demandaId", id));
    files.forEach((f) => formData.append("files", f));
    const descricao = (form.querySelector<HTMLInputElement>('[name="descricao"]')?.value ?? "").trim();
    if (descricao) formData.append("descricao", descricao);
    setIsSubmitting(true);
    try {
      const result = await createComprovacaoAction(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          result.comprovacoes?.length === 1
            ? "Comprovação vinculada com sucesso!"
            : `${result.comprovacoes?.length ?? 0} comprovações vinculadas com sucesso!`
        );
        setFiles([]);
        setSelectedIds(new Set());
        router.push("/comprovacoes");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Coluna esquerda: Upload */}
        <div className="order-2 lg:order-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 transition duration-200">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">1</span>
                Arraste os arquivos
              </h3>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                  multiple
                  accept=".pdf,.xml,.txt,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className={`mb-3 rounded-2xl p-4 transition ${isDragging ? "bg-blue-100" : "bg-slate-100"}`}>
                  <Upload className={`size-10 ${isDragging ? "text-blue-600" : "text-slate-500"}`} />
                </div>
                <p className="text-center text-sm font-medium text-slate-700">
                  {isDragging ? "Solte aqui!" : "Clique ou arraste"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  PDF, DOC, XLS, imagens… até {MAX_FILE_SIZE_MB}MB cada
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      {getFileIcon(f.name)}
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{f.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeFile(i); }}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                        aria-label="Remover arquivo"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label htmlFor="descricao" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Ex: Nota fiscal mar/2026"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Resumo e botão */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {selectedIds.size} {selectedIds.size === 1 ? "demanda" : "demandas"} • {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
                </span>
                {canSubmit && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Pronto para salvar
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
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Vincular comprovação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Coluna direita: Demandas */}
        <div className="order-1 lg:order-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">2</span>
                Escolha as demandas
              </h3>
              {demandas.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  {allSelected ? "Desmarcar todas" : "Marcar todas"}
                </button>
              )}
            </div>

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
                  <option key={opt.value || "todos"} value={opt.value}>{opt.label}</option>
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
                  {demandas.length} {demandas.length === 1 ? "demanda encontrada" : "demandas encontradas"}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demandas.map((d) => {
                  const isSelected = selectedIds.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleOne(d.id)}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                        {isSelected && <Check className="size-2.5 text-white" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800" title={d.demanda}>
                          {d.demanda}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono">{d.ocPi || "—"}</span>
                          <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[d.status] ?? ""}`}>
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

            {selectedDemandas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-500">Selecionadas:</span>
                {selectedDemandas.slice(0, 5).map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {d.demanda.length > 25 ? d.demanda.slice(0, 25) + "…" : d.demanda}
                  </span>
                ))}
                {selectedDemandas.length > 5 && (
                  <span className="text-xs text-slate-500">+{selectedDemandas.length - 5} mais</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
