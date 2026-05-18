"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload, X, FileText, Image, FileSpreadsheet } from "lucide-react";
import { createCertidaoAction } from "@/app/actions/certidao";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 10;

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png"].includes(ext)) return <Image className="size-5 text-pink-500" />;
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className="size-5 text-emerald-600" />;
  return <FileText className="size-5 text-blue-600" />;
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
    <form onSubmit={handleFormSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Arquivo da certidão</h2>
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
                  onClick={(e) => {
                    e.preventDefault();
                    removeFile(i);
                  }}
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
            placeholder="Ex.: Certidão negativa de débitos — mar/2026"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
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
              Enviar certidão
            </>
          )}
        </button>
      </div>
    </form>
  );
}
