"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { uploadComprovacaoAction, getComprovacoesAction, removeComprovacaoAction } from "@/app/actions/demanda-comprovacao";
import type { DemandaComprovacao } from "@/types/globals";
import { toast } from "sonner";
import { Upload, File, X, Download, Trash2, Send, Eye } from "lucide-react";
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
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
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

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : "";
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
  const [comprovacoes, setComprovacoes] = useState<DemandaComprovacao[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [previewComprovacao, setPreviewComprovacao] = useState<DemandaComprovacao | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();
  const canUpload = userRole === "admin" || userRole === "operator" || userRole === "agency";
  const showUploadArea = canUpload && comprovacoes.length === 0;

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

  async function handleFileUpload(file: File): Promise<boolean> {
    if (!canUpload) return false;

    const formData = new FormData();
    formData.append("file", file);
    if (descricao.trim()) {
      formData.append("descricao", descricao.trim());
    }

    try {
      const result = await uploadComprovacaoAction(demandaId, formData);
      if (result.error) {
        toast.error(`${file.name}: ${result.error}`);
        return false;
      } else if (result.comprovacao) {
        setComprovacoes((prev) => [result.comprovacao!, ...prev]);
        return true;
      }
      return false;
    } catch (error) {
      let errorMessage = `Erro ao enviar ${file.name}`;
      
      // Tratar erro de limite de tamanho do body
      if (error instanceof Error) {
        if (error.message.includes("Body exceeded") || error.message.includes("413")) {
          errorMessage = `O arquivo "${file.name}" é muito grande. O tamanho máximo permitido é 10MB. Por favor, escolha um arquivo menor.`;
        } else if (error.message.includes("413")) {
          errorMessage = `O arquivo "${file.name}" excede o limite de tamanho permitido (10MB).`;
        } else {
          errorMessage = `Erro ao enviar "${file.name}": ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  }

  async function handleSendComprovacoes() {
    if (!canUpload || selectedFiles.length === 0) return;

    const totalFiles = selectedFiles.length;
    let successCount = 0;
    let errorCount = 0;

    startTransition(async () => {
      // Upload sequencial para evitar sobrecarga
      for (const file of selectedFiles) {
        const success = await handleFileUpload(file);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Limpar arquivos selecionados e descrição após upload
      setSelectedFiles([]);
      setDescricao("");

      // Feedback consolidado
      if (successCount > 0 && errorCount === 0) {
        toast.success(`${successCount} arquivo${successCount > 1 ? "s" : ""} enviado${successCount > 1 ? "s" : ""} com sucesso!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`${successCount} arquivo${successCount > 1 ? "s" : ""} enviado${successCount > 1 ? "s" : ""}, ${errorCount} erro${errorCount > 1 ? "s" : ""}`);
      } else if (errorCount > 0) {
        toast.error(`Erro ao enviar ${errorCount} arquivo${errorCount > 1 ? "s" : ""}`);
      }
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveSelectedFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePreview(comprovacao: DemandaComprovacao) {
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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (canUpload) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canUpload) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }

  async function handleDownload(comprovacao: DemandaComprovacao) {
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

  async function handleRemove(comprovacao: DemandaComprovacao) {
    const ok = await confirm({
      title: "Remover comprovação",
      message: `Deseja realmente remover "${comprovacao.nomeArquivo}"?`,
      confirmLabel: "Remover",
      variant: "danger",
    });

    if (!ok) return;

    startTransition(async () => {
      const result = await removeComprovacaoAction(comprovacao.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setComprovacoes((prev) => prev.filter((c) => c.id !== comprovacao.id));
        toast.success("Comprovação removida com sucesso!");
      }
    });
  }

  return (
    <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
      <h3 className="text-sm font-semibold text-slate-800">Comprovações / Notas Fiscais</h3>

      {/* Área de upload (disponível para admin, operator e agency quando não há comprovações) */}
      {showUploadArea && (
        <div className="space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400"
            }`}
          >
            <Upload className="mx-auto mb-2 size-8 text-slate-400" />
            <p className="mb-2 text-sm text-slate-600">
              Arraste e solte arquivos aqui ou clique para selecionar
            </p>
            <p className="mb-4 text-xs text-slate-500">
              Formatos permitidos: PDF, XML, TXT, DOCX, DOC, XLSX, XLS, JPG, JPEG, PNG (máx. 10MB por arquivo)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.xml,.txt,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              id="file-upload"
              disabled={isPending}
            />
            <label
              htmlFor="file-upload"
              className="inline-block cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selecionar arquivos
            </label>
          </div>

          {/* Preview dos arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-700">
                Arquivos selecionados ({selectedFiles.length}):
              </p>
              <div className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFileIcon(getFileExtension(file.name))}</span>
                      <span className="text-slate-800">{file.name}</span>
                      <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSelectedFile(index)}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                      title="Remover arquivo"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo de descrição */}
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição para esta comprovação (opcional)"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />

          {/* Botão enviar */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSendComprovacoes}
                disabled={isPending || selectedFiles.length === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Enviar comprovações
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de comprovações */}
      <div className="max-h-64 overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          </div>
        ) : comprovacoes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhuma comprovação anexada ainda.
          </p>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Agrupar comprovações por descrição e data (arquivos enviados juntos)
              const grupos: Array<{ descricao?: string; createdAt: string; items: DemandaComprovacao[] }> = [];
              
              for (const comp of comprovacoes) {
                // Procurar grupo existente com mesma descrição e data próxima (mesmo segundo)
                const dataComp = new Date(comp.createdAt);
                const grupoExistente = grupos.find((g) => {
                  const dataGrupo = new Date(g.createdAt);
                  const mesmaDescricao = (g.descricao || "") === (comp.descricao || "");
                  const mesmoSegundo = Math.abs(dataComp.getTime() - dataGrupo.getTime()) < 2000; // 2 segundos de tolerância
                  return mesmaDescricao && mesmoSegundo;
                });

                if (grupoExistente) {
                  grupoExistente.items.push(comp);
                } else {
                  grupos.push({
                    descricao: comp.descricao,
                    createdAt: comp.createdAt,
                    items: [comp],
                  });
                }
              }

              return grupos.map((grupo, grupoIndex) => (
                <div key={grupoIndex} className="space-y-2">
                  {/* Descrição do grupo (se houver) */}
                  {grupo.descricao && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                      <p className="text-xs font-medium text-blue-800 mb-1">Descrição:</p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{grupo.descricao}</p>
                    </div>
                  )}
                  
                  {/* Arquivos do grupo */}
                  <div className="space-y-2">
                    {grupo.items.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between gap-2 overflow-hidden rounded-lg bg-white p-3 shadow-sm"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="shrink-0 text-2xl">{getFileIcon(comp.tipoArquivo)}</span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p
                              className="truncate text-sm font-medium text-slate-800"
                              title={comp.nomeArquivo}
                            >
                              {comp.nomeArquivo}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{formatFileSize(comp.tamanho)}</span>
                              <span>•</span>
                              <span>{comp.autor}</span>
                              <span>•</span>
                              <span>{formatDateTime(comp.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {canPreview(comp.tipoArquivo) && (
                            <button
                              onClick={() => handlePreview(comp)}
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                              title="Visualizar arquivo"
                            >
                              <Eye className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(comp)}
                            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
                            title="Baixar arquivo"
                          >
                            <Download className="size-4" />
                          </button>
                          {canUpload && (
                            <button
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
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Modal de preview */}
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
