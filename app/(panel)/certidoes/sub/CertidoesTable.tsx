"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Certidao } from "@/types/globals";
import { removeCertidaoAction } from "@/app/actions/certidao";
import { toast } from "sonner";
import { Download, Eye, File, FileCode, FileImage, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
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

function FileTypeIcon({ tipoArquivo }: { tipoArquivo: string }) {
  const ext = tipoArquivo.toLowerCase();
  const className = "size-4 shrink-0 text-neutral-400";
  if (ext === ".pdf" || [".doc", ".docx", ".txt"].includes(ext)) return <FileText className={className} aria-hidden />;
  if (ext === ".xml") return <FileCode className={className} aria-hidden />;
  if ([".xls", ".xlsx"].includes(ext)) return <FileSpreadsheet className={className} aria-hidden />;
  if ([".jpg", ".jpeg", ".png"].includes(ext)) return <FileImage className={className} aria-hidden />;
  return <File className={className} aria-hidden />;
}

function canPreview(tipoArquivo: string): boolean {
  const ext = tipoArquivo.toLowerCase();
  return ext === ".pdf" || ext === ".txt";
}

interface CertidoesTableProps {
  certidoes: Certidao[];
  userRole: "admin" | "operator" | "agency";
  emptyMessage?: string;
}

export function CertidoesTable({ certidoes, userRole, emptyMessage }: CertidoesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewCertidao, setPreviewCertidao] = useState<Certidao | null>(null);
  const { confirm } = useConfirm();
  const canRemove = userRole === "admin";

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

  return (
    <>
      <Table className="min-w-[680px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Arquivo</TableHeaderCell>
            <TableHeaderCell>Descrição</TableHeaderCell>
            <TableHeaderCell>Autor</TableHeaderCell>
            <TableHeaderCell>Data</TableHeaderCell>
            <TableHeaderCell className="w-32">
              <span className="sr-only">Ações</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {certidoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-neutral-500">
                {emptyMessage ?? "Nenhuma certidão cadastrada. Clique em “Nova certidão” para enviar uma."}
              </TableCell>
            </TableRow>
          ) : (
            certidoes.map((cert) => (
              <TableRow key={cert.id} className="transition-colors hover:bg-sky-50/60">
                <TableCell className="max-w-72">
                  <div className="flex items-center gap-2.5">
                    <FileTypeIcon tipoArquivo={cert.tipoArquivo} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-950" title={cert.nomeArquivo}>
                        {cert.nomeArquivo}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
                        {formatFileSize(cert.tamanho)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-64 truncate" title={cert.descricao || undefined}>
                  {cert.descricao || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatarThumb userId={cert.cadastradoPorUserId} label={cert.autor} />
                    <span className="truncate">{cert.autor}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(cert.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canPreview(cert.tipoArquivo) && (
                      <IconButton aria-label="Visualizar arquivo" onClick={() => setPreviewCertidao(cert)}>
                        <Eye />
                      </IconButton>
                    )}
                    <IconButton aria-label="Baixar arquivo" onClick={() => handleDownload(cert)}>
                      <Download />
                    </IconButton>
                    {canRemove && (
                      <IconButton
                        aria-label="Remover certidão"
                        variant="danger"
                        onClick={() => handleRemove(cert)}
                        disabled={isPending}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {previewCertidao && (
        <ComprovacaoPreviewModal
          comprovacaoId={previewCertidao.id}
          nomeArquivo={previewCertidao.nomeArquivo}
          tipoArquivo={previewCertidao.tipoArquivo}
          open={!!previewCertidao}
          onClose={() => setPreviewCertidao(null)}
          apiResource="certidoes"
        />
      )}
    </>
  );
}
