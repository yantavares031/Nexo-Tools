"use client";

import { useRef, useState } from "react";
import { FileSignature, FileText, Upload, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { uploadOrdemCompraAssinadaAction } from "@/app/actions/ordem-compra";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 10;

interface AssinarOrdemCompraModalProps {
  open: boolean;
  onClose: () => void;
  ordemCompraId: string;
  nomeArquivoEnviado: string;
  demandaDescricao: string;
  onSuccess: () => void;
}

export function AssinarOrdemCompraModal({
  open,
  onClose,
  ordemCompraId,
  nomeArquivoEnviado,
  demandaDescricao,
  onSuccess,
}: AssinarOrdemCompraModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetAndClose() {
    setFile(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Selecione o PDF da OC já assinada.");
      return;
    }
    const formData = new FormData();
    formData.append("ordemCompraId", ordemCompraId);
    formData.append("file", file);
    setIsSubmitting(true);
    try {
      const result = await uploadOrdemCompraAssinadaAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("OC assinada registrada com sucesso.");
        setFile(null);
        onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} maxWidth="lg" ariaLabelledby="assinar-oc-title">
      <Modal.Header onClose={resetAndClose}>
        <h2
          id="assinar-oc-title"
          className="flex items-center gap-2 text-lg font-semibold text-slate-800"
        >
          <FileSignature className="size-5 shrink-0" />
          Registrar OC assinada
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="form-assinar-oc" onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-medium text-slate-800">Demanda</p>
          <p className="mt-1 line-clamp-2" title={demandaDescricao}>
            {demandaDescricao || "—"}
          </p>
          <p className="mt-2 font-medium text-slate-800">Documento enviado pela agência</p>
          <p className="mt-1 truncate text-slate-600" title={nomeArquivoEnviado}>
            {nomeArquivoEnviado}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-800">PDF assinado (admin)</p>
          <div
            onDrop={(ev) => {
              ev.preventDefault();
              setIsDragging(false);
              const dropped = ev.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            onDragOver={(ev) => {
              ev.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                if (f) setFile(f);
                ev.target.value = "";
              }}
            />
            <Upload className={`mb-2 size-8 ${isDragging ? "text-blue-600" : "text-slate-400"}`} />
            <p className="text-center text-sm font-medium text-slate-700">
              Clique ou arraste o PDF assinado
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Apenas PDF, até {MAX_FILE_SIZE_MB}MB</p>
          </div>
          {file && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <FileText className="size-5 shrink-0 text-blue-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{file.name}</span>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
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
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={resetAndClose}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="form-assinar-oc"
          disabled={!file || isSubmitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Salvar e marcar como assinada"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
