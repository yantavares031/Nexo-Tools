"use client";

import { useRef, useState } from "react";
import { FileSignature, FileText, Upload, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
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
          className="flex items-center gap-2 text-lg font-semibold text-neutral-950"
        >
          <FileSignature className="size-5 shrink-0" />
          Registrar OC assinada
        </h2>
      </Modal.Header>
      <Modal.Body as="form" id="form-assinar-oc" onSubmit={handleSubmit} className="space-y-4 p-6">
        <dl className="space-y-3 rounded-xl border border-neutral-200 p-4">
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">Demanda</dt>
            <dd className="mt-0.5 line-clamp-2 text-[13px] text-neutral-950" title={demandaDescricao}>
              {demandaDescricao || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
              Documento enviado pela agência
            </dt>
            <dd className="mt-0.5 truncate text-[13px] text-neutral-700" title={nomeArquivoEnviado}>
              {nomeArquivoEnviado}
            </dd>
          </div>
        </dl>

        <div>
          <p className="mb-1.5 text-[13px] text-neutral-700">PDF assinado (admin)</p>
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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed py-8 transition ${
              isDragging
                ? "border-sky-400 bg-sky-50"
                : "border-neutral-300 bg-white hover:border-sky-300 hover:bg-sky-50/60"
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
            <Upload className={`mb-2 size-8 ${isDragging ? "text-link" : "text-neutral-400"}`} />
            <p className="text-center text-sm font-medium text-neutral-700">
              Clique ou arraste o PDF assinado
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Apenas PDF, até {MAX_FILE_SIZE_MB}MB</p>
          </div>
          {file && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
              <FileText className="size-5 shrink-0 text-link" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">{file.name}</span>
              <IconButton
                aria-label="Remover arquivo"
                variant="danger"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setFile(null);
                }}
              >
                <X />
              </IconButton>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={resetAndClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" form="form-assinar-oc" disabled={!file} loading={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Salvar e marcar como assinada"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
