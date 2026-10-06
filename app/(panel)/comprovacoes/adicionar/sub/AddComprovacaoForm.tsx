"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  FileImage,
  FileSpreadsheet,
  FileText,
  Search,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import type { Demanda } from "@/types/globals";
import { createComprovacaoAction } from "@/app/actions/demanda-comprovacao";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { DropdownItem } from "@/components/ui/dropdown-item";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { cn } from "@/lib/cn";
import { currencyFormat, integerFormat } from "@/lib/format";
import { formatMonthYearDisplay } from "@/lib/month-year";

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

const MAX_FILE_SIZE_MB = 10;

function addComprovacaoHref({ mes, q }: { mes: string; q?: string }): string {
  const params = new URLSearchParams();
  params.set("mes", mes);
  if (q) params.set("q", q);
  return `/comprovacoes/adicionar?${params.toString()}`;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const className = "size-4 shrink-0 text-neutral-400";
  if (["jpg", "jpeg", "png"].includes(ext)) return <FileImage className={className} aria-hidden />;
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className={className} aria-hidden />;
  return <FileText className={className} aria-hidden />;
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const search = defaultSearch.trim();
  const mesLabel = mesOptions.find((opt) => opt.value === defaultMes)?.label ?? formatMonthYearDisplay(defaultMes);

  const applySearch = (value: string) => {
    router.push(addComprovacaoHref({ mes: defaultMes, q: value.trim() || undefined }));
  };

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
    <form onSubmit={handleFormSubmit} noValidate className="max-w-4xl">
      <fieldset disabled={isSubmitting}>
        <PanelHeader
          title="Dados da comprovação"
          description={`${selectedIds.size} ${selectedIds.size === 1 ? "demanda" : "demandas"} · ${files.length} ${files.length === 1 ? "arquivo" : "arquivos"}`}
          actions={
            <>
              {canSubmit && <Badge tone="success">Pronto para salvar</Badge>}
              <Link href="/comprovacoes" className={cn(buttonBaseClassName, buttonVariants.ghost, buttonSizes.md)}>
                Cancelar
              </Link>
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                {!isSubmitting && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
                {isSubmitting ? "Salvando…" : "Vincular comprovação"}
              </Button>
            </>
          }
        />

        <FormSection
          icon={<Upload aria-hidden />}
          title="Arquivos"
          description={`PDF, DOC, XLS ou imagens, até ${MAX_FILE_SIZE_MB}MB cada.`}
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xml,.txt,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                isDragging ? "border-sky-400 bg-sky-50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50",
              )}
            >
              <span
                className={cn(
                  "rounded-full p-3 [&_svg]:size-5",
                  isDragging ? "bg-sky-100 text-sky-600" : "bg-neutral-100 text-neutral-500",
                )}
              >
                <Upload aria-hidden />
              </span>
              <span className="text-sm font-medium text-neutral-950">
                {isDragging ? "Solte os arquivos aqui" : "Clique ou arraste os arquivos"}
              </span>
              <span className="text-[13px] text-neutral-500">Você pode enviar vários arquivos de uma vez.</span>
            </button>

            {files.length > 0 && (
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
                    <FileIcon name={f.name} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-800" title={f.name}>
                      {f.name}
                    </span>
                    <IconButton aria-label="Remover arquivo" variant="danger" onClick={() => removeFile(i)}>
                      <X />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}

            <FormField id="descricao" label="Descrição (opcional)">
              <Input type="text" id="descricao" name="descricao" placeholder="Ex.: Nota fiscal mar/2026" />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Workflow aria-hidden />}
          title="Demandas"
          description="Selecione as demandas comprovadas por estes arquivos."
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex h-9 w-full items-center rounded-full border border-neutral-300 bg-white transition-colors focus-within:border-neutral-700 focus-within:ring-2 focus-within:ring-neutral-900/5 hover:border-neutral-400 sm:w-80">
                <Search className="ml-3.5 size-4 shrink-0 text-neutral-400" aria-hidden />
                <input
                  key={defaultSearch}
                  type="search"
                  defaultValue={defaultSearch}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch(e.currentTarget.value);
                    }
                  }}
                  placeholder="Buscar demanda e pressionar Enter"
                  aria-label="Buscar demandas"
                  className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                  <Link
                    href={addComprovacaoHref({ mes: defaultMes })}
                    aria-label="Limpar busca"
                    className="mr-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X className="size-3.5" />
                  </Link>
                )}
              </div>

              <Dropdown
                key={`mes-${defaultMes}-${search}`}
                highlighted={defaultMes !== ""}
                trigger={
                  <>
                    <CalendarDays aria-hidden />
                    <span className="opacity-70">Mês</span>
                    <span className="font-medium tabular-nums">{mesLabel}</span>
                  </>
                }
              >
                {mesOptions.map((opt) => (
                  <DropdownItem
                    key={opt.value || "todos"}
                    href={addComprovacaoHref({ mes: opt.value, q: search || undefined })}
                    active={opt.value === defaultMes}
                  >
                    {opt.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>

            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <Badge tone="dark" className="px-2.5 py-1">
                <span className="tabular-nums">{integerFormat.format(demandas.length)}</span>
                {demandas.length === 1 ? "demanda encontrada" : "demandas encontradas"}
              </Badge>
              {selectedIds.size > 0 && (
                <Badge tone="info" className="px-2.5 py-1">
                  <span className="tabular-nums">{integerFormat.format(selectedIds.size)}</span>
                  {selectedIds.size === 1 ? "selecionada" : "selecionadas"}
                </Badge>
              )}
              {demandas.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                  {allSelected ? "Desmarcar todas" : "Marcar todas"}
                </Button>
              )}
            </div>

            {demandas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 py-12 text-center text-[13px] text-neutral-500">
                Nenhuma demanda encontrada. Ajuste a busca ou o mês.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {demandas.map((d) => {
                  const isSelected = selectedIds.has(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleOne(d.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                        isSelected ? "border-sky-300 bg-sky-50" : "border-neutral-200 hover:bg-neutral-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                          isSelected ? "border-blue-600 bg-blue-600" : "border-neutral-300 bg-white",
                        )}
                      >
                        {isSelected && <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-neutral-950" title={d.demanda}>
                          {d.demanda}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <span className="tabular-nums">{d.ocPi || "—"}</span>
                          <Badge tone={STATUS_TONES[d.status] ?? "neutral"}>{STATUS_LABELS[d.status] ?? d.status}</Badge>
                          <span className="tabular-nums">{formatMonthYearDisplay(d.mes)}</span>
                          <span className="font-medium text-neutral-700 tabular-nums">{currencyFormat.format(d.valor)}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDemandas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
                <span className="text-xs text-neutral-500">Selecionadas:</span>
                {selectedDemandas.slice(0, 5).map((d) => (
                  <Badge key={d.id} tone="neutral" className="max-w-56">
                    <span className="truncate" title={d.demanda}>
                      {d.demanda}
                    </span>
                  </Badge>
                ))}
                {selectedDemandas.length > 5 && (
                  <span className="text-xs text-neutral-500">+{selectedDemandas.length - 5} mais</span>
                )}
              </div>
            )}
          </div>
        </FormSection>
      </fieldset>
    </form>
  );
}
