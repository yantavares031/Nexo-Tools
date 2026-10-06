"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComprovacaoListItem } from "@/lib/domain/demanda-comprovacao.repository";
import { removeComprovacaoAction } from "@/app/actions/demanda-comprovacao";
import { toast } from "sonner";
import { Download, Eye, File, FileCode, FileImage, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/confirm-provider";
import { IconButton } from "@/components/ui/icon-button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ComprovacaoPreviewModal } from "@/modals/sub/ComprovacaoPreviewModal";
import { VerDetalhesComprovacaoModal } from "@/modals/VerDetalhesComprovacaoModal";
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

interface ComprovacoesTableProps {
  comprovacoes: ComprovacaoListItem[];
  userRole: "admin" | "operator" | "agency";
  emptyMessage?: string;
}

export function ComprovacoesTable({ comprovacoes, userRole, emptyMessage }: ComprovacoesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [previewComprovacao, setPreviewComprovacao] = useState<ComprovacaoListItem | null>(null);
  const [detalhesComprovacaoId, setDetalhesComprovacaoId] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const canRemove = userRole === "admin";

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

  return (
    <>
      <Table className="min-w-[760px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Arquivo</TableHeaderCell>
            <TableHeaderCell>Descrição</TableHeaderCell>
            <TableHeaderCell>Autor</TableHeaderCell>
            <TableHeaderCell>Demandas</TableHeaderCell>
            <TableHeaderCell>Data</TableHeaderCell>
            <TableHeaderCell className="w-32">
              <span className="sr-only">Ações</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {comprovacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-neutral-500">
                {emptyMessage ?? "Nenhuma comprovação cadastrada. Clique em “Nova comprovação” para criar uma."}
              </TableCell>
            </TableRow>
          ) : (
            comprovacoes.map((comp) => (
              <TableRow
                key={comp.id}
                onClick={() => setDetalhesComprovacaoId(comp.id)}
                className="cursor-pointer transition-colors outline-none hover:bg-sky-50/60 focus-visible:bg-sky-50/60"
                role="button"
                tabIndex={0}
                aria-label={`Ver detalhes de ${comp.nomeArquivo}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetalhesComprovacaoId(comp.id);
                  }
                }}
              >
                <TableCell className="max-w-72">
                  <div className="flex items-center gap-2.5">
                    <FileTypeIcon tipoArquivo={comp.tipoArquivo} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-950" title={comp.nomeArquivo}>
                        {comp.nomeArquivo}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
                        {formatFileSize(comp.tamanho)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-56 truncate" title={comp.descricao || undefined}>
                  {comp.descricao || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatarThumb userId={comp.cadastradoPorUserId} label={comp.autor} />
                    <span className="truncate">{comp.autor}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="text-link tabular-nums">
                    {comp.demandaCount} {comp.demandaCount === 1 ? "demanda" : "demandas"}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(comp.createdAt)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {canPreview(comp.tipoArquivo) && (
                      <IconButton aria-label="Visualizar arquivo" onClick={() => setPreviewComprovacao(comp)}>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {previewComprovacao && (
        <ComprovacaoPreviewModal
          comprovacaoId={previewComprovacao.id}
          nomeArquivo={previewComprovacao.nomeArquivo}
          tipoArquivo={previewComprovacao.tipoArquivo}
          open={!!previewComprovacao}
          onClose={() => setPreviewComprovacao(null)}
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
