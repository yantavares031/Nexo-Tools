"use client";

import { useState, useEffect, useTransition } from "react";
import { getComprovacoesAction, removeComprovacaoFromDemandaAction } from "@/app/actions/demanda-comprovacao";
import type { Comprovacao } from "@/types/globals";
import { toast } from "sonner";
import { Download, Trash2, Eye } from "lucide-react";
import { useConfirm } from "@/lib/confirm-context";
import { ComprovacaoPreviewModal } from "./ComprovacaoPreviewModal";

interface DemandaComprovacoesProps {
  demandaId: string;
  userRole: "admin" | "operator" | "agency";
  onPreviewOpenChange?: (isOpen: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFileIcon(tipoArquivo: string) {
  const ext = tipoArquivo.toLowerCase();
  if (ext === ".pdf") return "📄";
  if (ext === ".xml") return "📋";
  if ([".doc", ".docx"].includes(ext)) return "📝";
  if ([".xls", ".xlsx"].includes(ext)) return "📊";
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return "🖼️";
  return "📎";
}

export function DemandaComprovacoes({ demandaId, userRole, onPreviewOpenChange }: DemandaComprovacoesProps) {
  const [comprovacoes, setComprovacoes] = useState<Comprovacao[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [previewComprovacao, setPreviewComprovacao] = useState<Comprovacao | null>(null);
  const { confirm } = useConfirm();
  const canRemove = userRole === "admin";

  useEffect(() => {
    async function loadComprovacoes() {
      try {
        const comps = await getComprovacoesAction(demandaId);
        setComprovacoes(comps);
      } catch (error) {
        console.error("Erro ao carregar comprovações:", error);
        toast.error("Erro ao carregar comprovações");
      } finally {
        setIsLoading(false);
      }
    }
    loadComprovacoes();
  }, [demandaId]);

  function handlePreview(comprovacao: Comprovacao) {
    setPreviewComprovacao(comprovacao);
    onPreviewOpenChange?.(true);
  }

  function handleClosePreview() {
    setPreviewComprovacao(null);
    onPreviewOpenChange?.(false);
  }

  function canPreview(tipoArquivo: string): boolean {
    const ext = tipoArquivo.toLowerCase();
    return ext === ".pdf" || ext === ".txt";
  }

  async function handleDownload(comprovacao: Comprovacao) {
    try {
      const response = await fetch(`/api/comprovacoes/${comprovacao.id}/download`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erro ao baixar arquivo" }));
        throw new Error(error.error || "Erro ao baixar arquivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = comprovacao.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar arquivo");
    }
  }

  async function handleRemove(comprovacao: Comprovacao) {
    const ok = await confirm({
      title: "Remover comprovação",
      message: `Deseja realmente remover "${comprovacao.nomeArquivo}" desta demanda? Se esta for a única demanda vinculada, a comprovação será removida do sistema.`,
      confirmLabel: "Remover",
      variant: "danger",
    });

    if (!ok) return;

    startTransition(async () => {
      const result = await removeComprovacaoFromDemandaAction(demandaId, comprovacao.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setComprovacoes((prev) => prev.filter((c) => c.id !== comprovacao.id));
        toast.success(
          result.removedComprovacao
            ? "Comprovação removida do sistema!"
            : "Comprovação desvinculada desta demanda!"
        );
      }
    });
  }

  return (
    <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
      <h3 className="text-sm font-semibold text-slate-800">Comprovações / Notas Fiscais</h3>
      <p className="text-xs text-slate-500">
        As comprovações são cadastradas na página Comprovações e vinculadas às demandas. Aqui são exibidas apenas as
        referências.
      </p>

      <div className="max-h-64 overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          </div>
        ) : comprovacoes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Nenhuma comprovação vinculada a esta demanda.</p>
        ) : (
          <div className="space-y-2">
            {comprovacoes.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between gap-2 overflow-hidden rounded-lg bg-white p-3 shadow-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 text-2xl">{getFileIcon(comp.tipoArquivo)}</span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-800" title={comp.nomeArquivo}>
                      {comp.nomeArquivo}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatFileSize(comp.tamanho)}</span>
                      <span>•</span>
                      <span>{comp.autor}</span>
                      <span>•</span>
                      <span>{formatDateTime(comp.createdAt)}</span>
                    </div>
                    {comp.descricao && (
                      <p className="mt-1 truncate text-xs text-slate-600" title={comp.descricao}>
                        {comp.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canPreview(comp.tipoArquivo) && (
                    <button
                      type="button"
                      onClick={() => handlePreview(comp)}
                      className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                      title="Visualizar arquivo"
                    >
                      <Eye className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(comp)}
                    className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                    title="Baixar arquivo"
                  >
                    <Download className="size-4" />
                  </button>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => handleRemove(comp)}
                      disabled={isPending}
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      title="Remover comprovação"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewComprovacao && (
        <ComprovacaoPreviewModal
          comprovacaoId={previewComprovacao.id}
          nomeArquivo={previewComprovacao.nomeArquivo}
          tipoArquivo={previewComprovacao.tipoArquivo}
          open={!!previewComprovacao}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
