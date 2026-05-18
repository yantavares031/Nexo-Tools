"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Certidao } from "@/types/globals";
import { removeCertidaoAction } from "@/app/actions/certidao";
import { toast } from "sonner";
import { Download, Trash2, Eye } from "lucide-react";
import { useConfirm } from "@/lib/confirm-context";
import { ComprovacaoPreviewModal } from "@/modals/sub/ComprovacaoPreviewModal";
import { UserAvatarThumb } from "@/components/UserAvatarThumb";

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

interface CertidoesTableProps {
  certidoes: Certidao[];
  userRole: "admin" | "operator" | "agency";
}

export function CertidoesTable({ certidoes, userRole }: CertidoesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewCertidao, setPreviewCertidao] = useState<Certidao | null>(null);
  const { confirm } = useConfirm();
  const canRemove = userRole === "admin";

  function handleClosePreview() {
    setPreviewCertidao(null);
  }

  async function handleDownload(cert: Certidao) {
    try {
      const response = await fetch(`/api/certidoes/${cert.id}/download`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erro ao baixar arquivo" }));
        throw new Error(error.error || "Erro ao baixar arquivo");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cert.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar arquivo");
    }
  }

  async function handleRemove(cert: Certidao) {
    const ok = await confirm({
      title: "Remover certidão",
      message: `Deseja realmente remover "${cert.nomeArquivo}"?`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeCertidaoAction(cert.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Certidão removida com sucesso!");
        router.refresh();
      }
    });
  }

  if (certidoes.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        Nenhuma certidão cadastrada. Clique em &quot;Adicionar&quot; para enviar uma.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Arquivo</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Descrição</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Autor</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Data</th>
              <th className="w-32 px-4 py-3 font-semibold text-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody>
            {certidoes.map((cert) => (
              <tr key={cert.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getFileIcon(cert.tipoArquivo)}</span>
                    <div className="min-w-0">
                      <p
                        className="truncate font-medium text-slate-800"
                        title={cert.nomeArquivo}
                      >
                        {cert.nomeArquivo}
                      </p>
                      <p className="text-xs text-slate-500">{formatFileSize(cert.tamanho)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="block max-w-[220px] truncate text-slate-600"
                    title={cert.descricao}
                  >
                    {cert.descricao || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserAvatarThumb userId={cert.cadastradoPorUserId} label={cert.autor} />
                    <span>{cert.autor}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(cert.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {canPreview(cert.tipoArquivo) && (
                      <button
                        type="button"
                        onClick={() => setPreviewCertidao(cert)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        title="Visualizar"
                      >
                        <Eye className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(cert)}
                      className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                      title="Baixar"
                    >
                      <Download className="size-4" />
                    </button>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemove(cert)}
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

      {previewCertidao && (
        <ComprovacaoPreviewModal
          comprovacaoId={previewCertidao.id}
          nomeArquivo={previewCertidao.nomeArquivo}
          tipoArquivo={previewCertidao.tipoArquivo}
          open={!!previewCertidao}
          onClose={handleClosePreview}
          apiResource="certidoes"
        />
      )}
    </>
  );
}
