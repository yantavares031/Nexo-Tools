"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileImage, FileSpreadsheet, FileText, NotebookPen, Upload, X } from "lucide-react";
import { createCertidaoAction } from "@/app/actions/certidao";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { cn } from "@/lib/cn";

const MAX_FILE_SIZE_MB = 10;

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const className = "size-4 shrink-0 text-neutral-400";
  if (["jpg", "jpeg", "png"].includes(ext)) return <FileImage className={className} aria-hidden />;
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className={className} aria-hidden />;
  return <FileText className={className} aria-hidden />;
}

export function AddCertidaoForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const canSubmit = files.length > 0;

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Adicione pelo menos um arquivo.");
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const descricao = (form.querySelector<HTMLInputElement>('[name="descricao"]')?.value ?? "").trim();
    if (descricao) formData.append("descricao", descricao);

    setIsSubmitting(true);
    try {
      const result = await createCertidaoAction(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          result.certidoes?.length === 1
            ? "Certidão enviada com sucesso!"
            : `${result.certidoes?.length ?? 0} certidões enviadas com sucesso!`
        );
        setFiles([]);
        router.push("/certidoes");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="max-w-3xl">
      <fieldset disabled={isSubmitting}>
        <PanelHeader
          title="Dados da certidão"
          description={`${files.length} ${files.length === 1 ? "arquivo selecionado" : "arquivos selecionados"}`}
          actions={
            <>
              {canSubmit && <Badge tone="success">Pronto para enviar</Badge>}
              <Link href="/certidoes" className={cn(buttonBaseClassName, buttonVariants.ghost, buttonSizes.md)}>
                Cancelar
              </Link>
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                {!isSubmitting && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
                {isSubmitting ? "Enviando…" : "Enviar certidão"}
              </Button>
            </>
          }
        />

        <FormSection
          icon={<Upload aria-hidden />}
          title="Arquivos"
          description={`PDF, DOC, XLS ou imagens, até ${MAX_FILE_SIZE_MB}MB cada.`}
        >
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
            <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-200">
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
        </FormSection>

        <FormSection icon={<NotebookPen aria-hidden />} title="Detalhes" description="Ajuda a identificar a certidão na listagem.">
          <FormField id="descricao" label="Descrição (opcional)">
            <Input
              type="text"
              id="descricao"
              name="descricao"
              placeholder="Ex.: Federal — abr/2026 ou FGTS — vigência 06/2026"
            />
          </FormField>
        </FormSection>
      </fieldset>
    </form>
  );
}
