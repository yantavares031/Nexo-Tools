"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileSignature, FileText, Search, Upload, Workflow, X } from "lucide-react";
import type { Demanda } from "@/types/globals";
import { createOrdemCompraAction } from "@/app/actions/ordem-compra";
import { toast } from "sonner";
import { formatMonthYearDisplay } from "@/lib/month-year";
import { cn } from "@/lib/cn";
import { currencyFormat, integerFormat } from "@/lib/format";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const STATUS_LABELS: Record<string, string> = {
  faturado: "Faturado",
  comprometido: "Comprometido",
  entregue: "Entregue",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  faturado: "success",
  comprometido: "warning",
  entregue: "neutral",
};

const MAX_FILE_SIZE_MB = 10;

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
    <form onSubmit={handleFormSubmit} noValidate className="max-w-4xl">
      <FormSection
        icon={<Workflow aria-hidden />}
        title="Demanda"
        description="Escolha a demanda à qual a OC será vinculada."
      >
        <div className="mb-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
          <FormField id="oc-demanda-search" label="Buscar demanda">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <Input
                id="oc-demanda-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyFilters();
                  }
                }}
                placeholder="Descrição ou OC/PI"
                className="pl-9"
              />
            </div>
          </FormField>
          <FormField id="oc-demanda-mes" label="Mês">
            <Select
              id="oc-demanda-mes"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-full"
            >
              {mesOptions.map((opt) => (
                <option key={opt.value || "todos"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="button" variant="outline" className="h-10" onClick={applyFilters}>
            Filtrar
          </Button>
        </div>

        {demandas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 py-12 text-center text-[13px] text-neutral-500">
            Nenhuma demanda encontrada. Ajuste os filtros.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[13px] text-neutral-500">
              <span className="tabular-nums">{integerFormat.format(demandas.length)}</span>{" "}
              {demandas.length === 1 ? "demanda encontrada" : "demandas encontradas"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Demandas">
              {demandas.map((d) => {
                const isSelected = selectedId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800",
                      isSelected
                        ? "border-neutral-800 bg-sky-50/60"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-sky-50/60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                        isSelected ? "border-blue-600 bg-blue-600" : "border-neutral-300 bg-white",
                      )}
                      aria-hidden
                    >
                      {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-950" title={d.demanda}>
                        {d.demanda}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                        <span className="tabular-nums">{d.ocPi || "—"}</span>
                        <Badge tone={STATUS_TONES[d.status] ?? "neutral"}>
                          {STATUS_LABELS[d.status] ?? d.status}
                        </Badge>
                        <span>{formatMonthYearDisplay(d.mes)}</span>
                        <span className="font-medium text-neutral-700 tabular-nums">
                          {currencyFormat.format(d.valor)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </FormSection>

      <FormSection
        icon={<FileSignature aria-hidden />}
        title="Documento da OC"
        description={`Arquivo PDF que será enviado para assinatura, até ${MAX_FILE_SIZE_MB}MB.`}
      >
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed py-10 transition-colors",
            isDragging
              ? "border-neutral-700 bg-sky-50/60"
              : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <span className="mb-3 rounded-full bg-neutral-100 p-3 text-neutral-400">
            <Upload className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-neutral-950">
            {isDragging ? "Solte o PDF aqui" : "Clique ou arraste o PDF"}
          </p>
          <p className="mt-0.5 text-[13px] text-neutral-500">Apenas PDF, até {MAX_FILE_SIZE_MB}MB</p>
        </div>

        {file && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2">
            <FileText className="size-4 shrink-0 text-neutral-400" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-neutral-800" title={file.name}>
              {file.name}
            </span>
            <IconButton
              aria-label="Remover arquivo"
              variant="danger"
              onClick={(e) => {
                e.preventDefault();
                setFile(null);
              }}
            >
              <X />
            </IconButton>
          </div>
        )}
      </FormSection>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-6">
        <p className="mr-auto text-[13px] text-neutral-500">
          {selectedId ? "1 demanda" : "Nenhuma demanda"} • {file ? "1 arquivo" : "Nenhum arquivo"}
          {canSubmit && (
            <Badge tone="success" className="ml-2">
              Pronto para enviar
            </Badge>
          )}
        </p>
        <Link
          href="/ordens-compra"
          className={cn(buttonBaseClassName, buttonVariants.ghost, buttonSizes.md)}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar pedido de assinatura"}
        </Button>
      </div>
    </form>
  );
}
