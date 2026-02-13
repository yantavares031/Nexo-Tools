"use client";

import { useState, useEffect } from "react";
import { FileText, File } from "lucide-react";
import { Modal } from "@/components/Modal";

interface ComprovacaoPreviewModalProps {
  comprovacaoId: string;
  nomeArquivo: string;
  tipoArquivo: string;
  open: boolean;
  onClose: () => void;
}

export function ComprovacaoPreviewModal({
  comprovacaoId,
  nomeArquivo,
  tipoArquivo,
  open,
  onClose,
}: ComprovacaoPreviewModalProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setContent("");
      setError(null);
      setIsLoading(true);
      return;
    }

    async function loadPreview() {
      try {
        setIsLoading(true);
        setError(null);

        if (tipoArquivo.toLowerCase() === ".pdf") {
          setContent(`/api/comprovacoes/${comprovacaoId}/preview`);
        } else if (tipoArquivo.toLowerCase() === ".txt") {
          const response = await fetch(`/api/comprovacoes/${comprovacaoId}/preview`);
          if (!response.ok) throw new Error("Erro ao carregar arquivo");
          const text = await response.text();
          setContent(text);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar preview");
      } finally {
        setIsLoading(false);
      }
    }

    loadPreview();
  }, [open, comprovacaoId, tipoArquivo]);

  const isPdf = tipoArquivo.toLowerCase() === ".pdf";
  const isTxt = tipoArquivo.toLowerCase() === ".txt";

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="6xl"
      ariaLabelledby="preview-title"
      innerClassName="flex h-[95vh] flex-col overflow-hidden"
    >
      <Modal.Header onClose={onClose}>
        <h2 id="preview-title" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          {isPdf ? <File className="size-5 shrink-0" /> : <FileText className="size-5 shrink-0" />}
          Preview: {nomeArquivo}
        </h2>
      </Modal.Header>
      <div className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
              <p className="text-sm text-slate-500">Carregando preview...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : isPdf ? (
          <iframe
            src={content}
            className="h-full min-h-0 w-full"
            title={`Preview de ${nomeArquivo}`}
          />
        ) : isTxt ? (
          <div className="h-full min-h-0 overflow-auto p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800">{content}</pre>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
