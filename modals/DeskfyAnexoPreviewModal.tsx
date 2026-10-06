"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button, buttonBaseClassName, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { isDocxAttachment } from "@/lib/deskfy/is-docx-attachment";

type DeskfyAnexoPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  extension?: string | null;
  contentType?: string | null;
};

type DocxState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; html: string }
  | { status: "error"; message: string };

export function DeskfyAnexoPreviewModal({
  open,
  onClose,
  url,
  title,
  extension,
  contentType,
}: DeskfyAnexoPreviewModalProps) {
  const useMammoth = isDocxAttachment(extension, contentType, url);
  const [docx, setDocx] = useState<DocxState>({ status: "idle" });

  useEffect(() => {
    if (!open) {
      setDocx({ status: "idle" });
      return;
    }

    if (!useMammoth || !url) {
      setDocx({ status: "idle" });
      return;
    }

    let cancelled = false;
    setDocx({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch(url, { mode: "cors", credentials: "omit" });
        if (!res.ok) {
          throw new Error(`Não foi possível baixar o arquivo (${res.status}).`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (cancelled) return;
        setDocx({ status: "ready", html: result.value });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Falha ao converter o documento. Pode ser bloqueio de CORS ou rede.";
        setDocx({
          status: "error",
          message: `${msg} Use o botão Abrir em nova aba para baixar ou abrir no Word.`,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, url, useMammoth]);

  const footerHint = useMammoth
    ? "DOCX: texto convertido no navegador com Mammoth; o layout pode diferir do Word."
    : "PDF e imagens costumam aparecer no quadro acima. Alguns servidores bloqueiam iframe (página em branco).";

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="6xl"
      ariaLabelledby="deskfy-anexo-preview-title"
      innerClassName="flex max-h-[92vh] flex-col overflow-hidden"
    >
      <Modal.Header onClose={onClose}>
        <h2
          id="deskfy-anexo-preview-title"
          className="flex min-w-0 items-center gap-2 text-lg font-semibold text-neutral-950"
        >
          <FileText className="size-5 shrink-0" aria-hidden />
          <span className="truncate" title={title}>
            Pré-visualização — {title}
          </span>
        </h2>
      </Modal.Header>
      <Modal.Body className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-[min(72vh,640px)] w-full flex-1 bg-neutral-100">
          {useMammoth ? (
            <>
              {docx.status === "loading" && (
                <div className="flex h-full min-h-[min(72vh,640px)] flex-col items-center justify-center gap-3 bg-white">
                  <Spinner className="size-8 text-neutral-400" />
                  <p className="text-sm text-neutral-500">Convertendo documento…</p>
                </div>
              )}
              {docx.status === "error" && (
                <div className="flex h-full min-h-[min(72vh,640px)] items-center justify-center bg-white p-6">
                  <p className="max-w-md text-left text-sm text-red-700">{docx.message}</p>
                </div>
              )}
              {docx.status === "ready" && (
                <div className="h-full min-h-[min(72vh,640px)] overflow-y-auto bg-white">
                  <div
                    className="docx-preview max-w-none p-6 text-left text-sm leading-relaxed text-neutral-800 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-neutral-200 [&_th]:bg-neutral-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                    dangerouslySetInnerHTML={{ __html: docx.html }}
                  />
                </div>
              )}
              {docx.status === "idle" && (
                <div className="h-full min-h-[min(72vh,640px)] bg-white" aria-hidden />
              )}
            </>
          ) : (
            <iframe
              src={url}
              title={title}
              className="h-full min-h-[min(72vh,640px)] w-full border-0 bg-white"
            />
          )}
        </div>
        <p className="border-t border-neutral-200 bg-neutral-50 px-4 py-2.5 text-left text-xs leading-relaxed text-neutral-500">
          {footerHint}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonBaseClassName, buttonVariants.outline, buttonSizes.md)}
        >
          Abrir em nova aba
        </a>
        <Button type="button" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
