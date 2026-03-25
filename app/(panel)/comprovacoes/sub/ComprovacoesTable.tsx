"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComprovacaoListItem } from "@/lib/domain/demanda-comprovacao.repository";
import { removeComprovacaoAction } from "@/app/actions/demanda-comprovacao";
import { toast } from "sonner";
import { Download, Trash2, Eye } from "lucide-react";
import { useConfirm } from "@/lib/confirm-context";
import { ComprovacaoPreviewModal } from "@/modals/sub/ComprovacaoPreviewModal";
import { VerDetalhesComprovacaoModal } from "@/modals/VerDetalhesComprovacaoModal";

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

function getFileIcon(tipoArquivo: string): string {
  const ext = tipoArquivo.toLowerCase();
  if (ext === ".pdf") return "📄";
  if (ext === ".xml") return "📋";
  if ([".doc", ".docx"].includes(ext)) return "📝";
  if ([".xls", ".xlsx"].includes(ext)) return "📊";
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return "🖼️";
  return "📎";
}

function canPreview(tipoArquivo: string): boolean {
  const ext = tipoArquivo.toLowerCase();
  return ext === ".pdf" || ext === ".txt";
}

interface ComprovacoesTableProps {
  comprovacoes: ComprovacaoListItem[];
  userRole: "admin" | "operator" | "agency";
}

export function ComprovacoesTable({ comprovacoes, userRole }: ComprovacoesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewComprovacao, setPreviewComprovacao] = useState<ComprovacaoListItem | null>(null);
  const [detalhesComprovacaoId, setDetalhesComprovacaoId] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const canRemove = userRole === "admin";

  function handlePreview(comp: ComprovacaoListItem) {
    setPreviewComprovacao(comp);
  }

  function handleClosePreview() {
    setPreviewComprovacao(null);
  }

  async function handleDownload(comp: ComprovacaoListItem) {
    try {
      const response = await fetch(`/api/comprovacoes/${comp.id}/download`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erro ao baixar arquivo" }));
        throw new Error(error.error || "Erro ao baixar arquivo");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = comp.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar arquivo");
    }
  }

  async function handleRemove(comp: ComprovacaoListItem) {
    const ok = await confirm({
      title: "Remover comprovação",
      message: `Deseja realmente remover "${comp.nomeArquivo}"? A comprovação será removida de todas as demandas vinculadas.`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeComprovacaoAction(comp.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Comprovação removida com sucesso!");
        router.refresh();
      }
    });
  }

  if (comprovacoes.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        Nenhuma comprovação cadastrada. Clique em &quot;Adicionar&quot; para criar uma.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Arquivo</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Descrição</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Autor</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Demandas</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Data</th>
              <th className="w-32 px-4 py-3 font-semibold text-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody>
            {comprovacoes.map((comp) => (
              <tr
                key={comp.id}
                onClick={() => setDetalhesComprovacaoId(comp.id)}
                className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetalhesComprovacaoId(comp.id);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getFileIcon(comp.tipoArquivo)}</span>
                    <div className="min-w-0">
                      <p
                        className="truncate font-medium text-slate-800"
                        title={comp.nomeArquivo}
                      >
                        {comp.nomeArquivo}
                      </p>
                      <p className="text-xs text-slate-500">{formatFileSize(comp.tamanho)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="block max-w-[180px] truncate text-slate-600"
                    title={comp.descricao}
                  >
                    {comp.descricao || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{comp.autor}</td>
                <td className="px-4 py-3 text-slate-600">
                  {comp.demandaCount} {comp.demandaCount === 1 ? "demanda" : "demandas"}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(comp.createdAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {canPreview(comp.tipoArquivo) && (
                      <button
                        type="button"
                        onClick={() => handlePreview(comp)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        title="Visualizar"
                      >
                        <Eye className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(comp)}
                      className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                      title="Baixar"
                    >
                      <Download className="size-4" />
                    </button>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemove(comp)}
                        disabled={isPending}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        title="Remover"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <VerDetalhesComprovacaoModal
        comprovacaoId={detalhesComprovacaoId}
        open={!!detalhesComprovacaoId}
        onClose={() => setDetalhesComprovacaoId(null)}
      />
    </>
  );
}
