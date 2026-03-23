"use client";

import { useEffect, useState } from "react";
import { FileCheck, Download, Eye } from "lucide-react";
import { Modal } from "@/components/Modal";
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
            className="flex items-center gap-2 text-lg font-semibold text-slate-800"
          >
            <FileCheck className="size-5 shrink-0" />
            Detalhes da comprovação
          </h2>
        </Modal.Header>
        <Modal.Body className="max-h-[70vh] p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            </div>
          ) : comprovacao ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Arquivo</h3>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{comprovacao.nomeArquivo}</p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(comprovacao.tamanho)} • {formatDateTime(comprovacao.createdAt)}
                    </p>
                    {comprovacao.descricao && (
                      <p className="mt-2 text-sm text-slate-600">{comprovacao.descricao}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">Autor: {comprovacao.autor}</p>
                  </div>
                  <div className="flex gap-2">
                    {canPreview(comprovacao.tipoArquivo) && (
                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="size-4" />
                        Visualizar
                      </button>
                    )}
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                    >
                      <Download className="size-4" />
                      Baixar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">
                  Demandas vinculadas ({demandas.length})
                </h3>
                {demandas.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma demanda vinculada.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 font-semibold text-slate-800">Demanda</th>
                          <th className="px-4 py-3 font-semibold text-slate-800">OC/PI</th>
                          <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
                          <th className="px-4 py-3 font-semibold text-slate-800">Mês</th>
                          <th className="px-4 py-3 font-semibold text-slate-800">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demandas.map((d) => (
                          <tr key={d.id} className="border-b border-slate-100">
                            <td className="px-4 py-3 text-slate-800">
                              <span className="block max-w-[200px] truncate" title={d.demanda}>
                                {d.demanda}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">{d.ocPi || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {STATUS_LABELS[d.status] ?? d.status}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatMonthYearDisplay(d.mes)}
                            </td>
                            <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                              {formatCurrency(d.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              Comprovação não encontrada.
            </p>
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
