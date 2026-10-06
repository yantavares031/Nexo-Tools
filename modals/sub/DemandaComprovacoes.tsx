"use client";

import { useState, useEffect, useTransition } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { getComprovacoesAction, removeComprovacaoFromDemandaAction } from "@/app/actions/demanda-comprovacao";
import type { Comprovacao } from "@/types/globals";
import { toast } from "sonner";
import { Download, Trash2, Eye } from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
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
    <div className="mt-6 space-y-3 border-t border-neutral-200 pt-6">
      <h3 className="text-sm font-semibold text-neutral-950">Comprovações / notas fiscais</h3>
      <p className="text-xs text-neutral-500">
        As comprovações são cadastradas na página Comprovações e vinculadas às demandas. Aqui são exibidas apenas as
        referências.
      </p>

      <div className="max-h-64 overflow-x-hidden overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-neutral-400" />
          </div>
        ) : comprovacoes.length === 0 ? (
          <p className="py-8 text-[13px] text-neutral-500">Nenhuma comprovação vinculada a esta demanda.</p>
        ) : (
          <div className="space-y-2">
            {comprovacoes.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 text-2xl">{getFileIcon(comp.tipoArquivo)}</span>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-[13px] font-medium text-neutral-950" title={comp.nomeArquivo}>
                      {comp.nomeArquivo}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] tabular-nums text-neutral-500">
                      <span>{formatFileSize(comp.tamanho)}</span>
                      <span>•</span>
                      <span>{comp.autor}</span>
                      <span>•</span>
                      <span>{formatDateTime(comp.createdAt)}</span>
                    </div>
                    {comp.descricao && (
                      <p className="mt-1 truncate text-xs text-neutral-600" title={comp.descricao}>
                        {comp.descricao}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canPreview(comp.tipoArquivo) && (
                    <IconButton aria-label="Visualizar arquivo" onClick={() => handlePreview(comp)}>
                      <Eye />
                    </IconButton>
                  )}
                  <IconButton aria-label="Baixar arquivo" onClick={() => handleDownload(comp)}>
                    <Download />
                  </IconButton>
                  {canRemove && (
                    <IconButton
                      aria-label="Remover comprovação"
                      variant="danger"
                      onClick={() => handleRemove(comp)}
                      disabled={isPending}
                    >
                      <Trash2 />
                    </IconButton>
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
