"use client";

import { useEffect, useState } from "react";
import { FileCheck, Download, Eye } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { getComprovacaoDetalhesAction } from "@/app/actions/demanda-comprovacao";
import type { Comprovacao } from "@/types/globals";
import type { Demanda } from "@/types/globals";
import { ComprovacaoPreviewModal } from "./sub/ComprovacaoPreviewModal";
import { formatMonthYearDisplay } from "@/lib/month-year";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

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

function canPreview(tipoArquivo: string): boolean {
  const ext = tipoArquivo.toLowerCase();
  return ext === ".pdf" || ext === ".txt";
}

interface VerDetalhesComprovacaoModalProps {
  comprovacaoId: string | null;
  open: boolean;
  onClose: () => void;
}

export function VerDetalhesComprovacaoModal({
  comprovacaoId,
  open,
  onClose,
}: VerDetalhesComprovacaoModalProps) {
  const [comprovacao, setComprovacao] = useState<Comprovacao | null>(null);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open || !comprovacaoId) {
      setComprovacao(null);
      setDemandas([]);
      return;
    }
    setIsLoading(true);
    getComprovacaoDetalhesAction(comprovacaoId)
      .then((result) => {
        if ("error" in result) {
          setComprovacao(null);
          setDemandas([]);
        } else {
          setComprovacao(result.comprovacao);
          setDemandas(result.demandas);
        }
      })
      .finally(() => setIsLoading(false));
  }, [open, comprovacaoId]);

  async function handleDownload() {
    if (!comprovacao) return;
    try {
      const response = await fetch(`/api/comprovacoes/${comprovacao.id}/download`);
      if (!response.ok) throw new Error("Erro ao baixar");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = comprovacao.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // toast handled by caller if needed
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} maxWidth="2xl" ariaLabelledby="modal-comprovacao-title">
        <Modal.Header onClose={onClose}>
          <h2
            id="modal-comprovacao-title"
            className="flex items-center gap-2 text-lg font-semibold text-neutral-950"
          >
            <FileCheck className="size-5 shrink-0" />
            Detalhes da comprovação
          </h2>
        </Modal.Header>
        <Modal.Body className="max-h-[70vh] p-6">
          {isLoading ? (
            <div className="flex justify-center py-12 text-neutral-400">
              <Spinner className="size-8" />
            </div>
          ) : comprovacao ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-950" title={comprovacao.nomeArquivo}>
                      {comprovacao.nomeArquivo}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-neutral-500">
                      {formatFileSize(comprovacao.tamanho)} • {formatDateTime(comprovacao.createdAt)}
                    </p>
                    {comprovacao.descricao && (
                      <p className="mt-2 text-[13px] text-neutral-600">{comprovacao.descricao}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">Autor: {comprovacao.autor}</p>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(comprovacao.tipoArquivo) && (
                      <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                        <Eye className="size-4" aria-hidden />
                        Visualizar
                      </Button>
                    )}
                    <Button type="button" size="sm" onClick={handleDownload}>
                      <Download className="size-4" aria-hidden />
                      Baixar
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-950">
                  Demandas vinculadas
                  <span className="text-xs font-normal tabular-nums text-neutral-400">{demandas.length}</span>
                </h3>
                {demandas.length === 0 ? (
                  <p className="py-6 text-[13px] text-neutral-500">Nenhuma demanda vinculada.</p>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Demanda</TableHeaderCell>
                        <TableHeaderCell>OC/PI</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Mês</TableHeaderCell>
                        <TableHeaderCell>Valor</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demandas.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="max-w-[200px] truncate font-medium text-neutral-950" title={d.demanda}>
                            {d.demanda}
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{d.ocPi || "—"}</TableCell>
                          <TableCell>
                            <Badge tone={STATUS_TONES[d.status] ?? "neutral"}>{STATUS_LABELS[d.status] ?? d.status}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatMonthYearDisplay(d.mes)}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums text-neutral-800">
                            {formatCurrency(d.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-[13px] text-neutral-500">Comprovação não encontrada.</p>
          )}
        </Modal.Body>
      </Modal>

      {comprovacao && (
        <ComprovacaoPreviewModal
          comprovacaoId={comprovacao.id}
          nomeArquivo={comprovacao.nomeArquivo}
          tipoArquivo={comprovacao.tipoArquivo}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
