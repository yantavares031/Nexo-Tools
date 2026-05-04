"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { OrdemCompraListItem } from "@/lib/domain/ordem-compra.repository";
import { removeOrdemCompraEmAbertoAction } from "@/app/actions/ordem-compra";
import { toast } from "sonner";
import { ChevronDown, Download, Eye, FileSignature, FileText, Trash2 } from "lucide-react";
import { ComprovacaoPreviewModal } from "@/modals/sub/ComprovacaoPreviewModal";
import { AssinarOrdemCompraModal } from "@/modals/AssinarOrdemCompraModal";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useConfirm } from "@/lib/confirm-context";
import type { OrdensCompraTab } from "./OrdensCompraPagination";
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

const STATUS_LABEL: Record<string, string> = {
  em_aberto: "Em aberto",
  assinada: "Assinada",
};

const ROW_MENU_WIDTH = 248;
const VIEWPORT_EDGE = 8;
const MENU_GAP = 6;

function computeMenuTop(trigger: DOMRect, estHeight: number): number {
  const spaceBelow = window.innerHeight - trigger.bottom - VIEWPORT_EDGE;
  const spaceAbove = trigger.top - VIEWPORT_EDGE;
  const h = estHeight;

  if (spaceBelow >= h) {
    return trigger.bottom + MENU_GAP;
  }
  if (spaceAbove >= h) {
    return trigger.top - h - MENU_GAP;
  }
  const downTop = trigger.bottom + MENU_GAP;
  const upTop = trigger.top - h - MENU_GAP;
  if (spaceAbove >= spaceBelow) {
    return Math.max(VIEWPORT_EDGE, upTop);
  }
  return Math.min(downTop, window.innerHeight - h - VIEWPORT_EDGE);
}

/** signed-full: PDF assinado + enviado; signed-simple: só enviado (legado); open: em aberto */
type OcRowMenuKind = "signed-full" | "signed-simple" | "open";

type OcRowMenuState = {
  ocId: string;
  kind: OcRowMenuKind;
  top: number;
  left: number;
};

interface OrdensCompraTableProps {
  ordens: OrdemCompraListItem[];
  userRole: "admin" | "operator" | "agency";
  tab: OrdensCompraTab;
}

type PreviewState = {
  item: OrdemCompraListItem;
  versao: "original" | "assinada";
};

export function OrdensCompraTable({ ordens, userRole, tab }: OrdensCompraTableProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [assinarItem, setAssinarItem] = useState<OrdemCompraListItem | null>(null);
  const [rowMenu, setRowMenu] = useState<OcRowMenuState | null>(null);
  const [menuPortalReady, setMenuPortalReady] = useState(false);
  const isAdmin = userRole === "admin";
  const isAgency = userRole === "agency";

  useEffect(() => {
    setMenuPortalReady(true);
  }, []);

  const closeRowMenu = useCallback(() => setRowMenu(null), []);

  useEscapeKey(closeRowMenu, rowMenu !== null);

  useEffect(() => {
    if (!rowMenu) return;
    function handlePointerDown(e: PointerEvent) {
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-oc-row-menu]") || el.closest("[data-oc-row-trigger]")) {
        return;
      }
      setRowMenu(null);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [rowMenu]);

  function ocTemPdfAssinado(oc: OrdemCompraListItem): boolean {
    return Boolean(
      oc.caminhoArquivoAssinado && oc.nomeArquivoAssinado && oc.tipoArquivoAssinado
    );
  }

  async function handleDownload(item: OrdemCompraListItem, versao: "original" | "assinada") {
    const qs = versao === "assinada" ? "?versao=assinada" : "";
    try {
      const response = await fetch(`/api/ordens-compra/${item.id}/download${qs}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Erro ao baixar arquivo" }));
        throw new Error(error.error || "Erro ao baixar arquivo");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name =
        versao === "assinada" && item.nomeArquivoAssinado
          ? item.nomeArquivoAssinado
          : item.nomeArquivo;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download iniciado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar arquivo");
    }
  }

  function estimateMenuHeight(kind: OcRowMenuKind): number {
    if (kind === "signed-full") return 248;
    if (kind === "signed-simple") return 96;
    return isAdmin ? 268 : 228;
  }

  function toggleRowMenu(ocId: string, kind: OcRowMenuKind, triggerEl: HTMLButtonElement) {
    const estHeight = estimateMenuHeight(kind);
    setRowMenu((prev) => {
      if (prev?.ocId === ocId && prev?.kind === kind) return null;
      const r = triggerEl.getBoundingClientRect();
      const left = Math.max(
        VIEWPORT_EDGE,
        Math.min(r.right - ROW_MENU_WIDTH, window.innerWidth - ROW_MENU_WIDTH - VIEWPORT_EDGE)
      );
      return {
        ocId,
        kind,
        top: computeMenuTop(r, estHeight),
        left,
      };
    });
  }

  const menuOc = rowMenu ? ordens.find((o) => o.id === rowMenu.ocId) : undefined;

  async function handleRemovePedido(oc: OrdemCompraListItem) {
    const ok = await confirm({
      title: "Remover pedido de OC",
      message: `Remover o pedido vinculado a "${oc.nomeArquivo}"? O arquivo será excluído e não poderá ser desfeito.`,
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await removeOrdemCompraEmAbertoAction(oc.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pedido removido.");
        closeRowMenu();
        router.refresh();
      }
    });
  }

  const previewModalProps =
    preview &&
    (() => {
      const { item, versao } = preview;
      const nome =
        versao === "assinada" && item.nomeArquivoAssinado
          ? item.nomeArquivoAssinado
          : item.nomeArquivo;
      const tipo =
        versao === "assinada" && item.tipoArquivoAssinado
          ? item.tipoArquivoAssinado
          : item.tipoArquivo;
      return { nome, tipo, versao };
    })();

  if (ordens.length === 0) {
    const empty =
      tab === "abertas"
        ? "Nenhum pedido em aberto."
        : "Nenhuma OC assinada registrada ainda.";
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[880px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-800">Documento</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Demanda</th>
              <th className="px-4 py-3 font-semibold text-slate-800">OC/PI</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Autor</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-800">Data</th>
              <th className="w-44 px-4 py-3 font-semibold text-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordens.map((oc) => {
              const temAssinada = ocTemPdfAssinado(oc);
              const isAssinada = oc.status === "assinada";
              const usarMenuSignedFull = tab === "assinadas" && temAssinada;
              const usarMenuSignedSimple = tab === "assinadas" && isAssinada && !temAssinada;
              const usarMenuOpen = tab === "abertas" && oc.status === "em_aberto";
              const mostrarMenuAcoes = usarMenuSignedFull || usarMenuSignedSimple || usarMenuOpen;

              const menuKind: OcRowMenuKind | null = usarMenuSignedFull
                ? "signed-full"
                : usarMenuSignedSimple
                  ? "signed-simple"
                  : usarMenuOpen
                    ? "open"
                    : null;

              return (
                <tr key={oc.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          isAssinada
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        aria-hidden
                      >
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800" title={oc.nomeArquivo}>
                          {oc.nomeArquivo}
                        </p>
                        <p className="text-xs text-slate-500">{formatFileSize(oc.tamanho)}</p>
                        {tab === "assinadas" && temAssinada && oc.nomeArquivoAssinado && (
                          <p
                            className="mt-1 truncate text-xs text-emerald-700"
                            title={oc.nomeArquivoAssinado}
                          >
                            Assinada: {oc.nomeArquivoAssinado}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-[200px] truncate text-slate-600"
                      title={oc.demandaDescricao}
                    >
                      {oc.demandaDescricao || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {oc.demandaOcPi ? (
                      <span
                        className="inline-block max-w-[140px] truncate font-mono text-xs text-slate-700"
                        title={oc.demandaOcPi}
                      >
                        {oc.demandaOcPi}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserAvatarThumb userId={oc.cadastradoPorUserId} label={oc.autor} />
                      <span>{oc.autor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-left text-slate-600">
                    {isAssinada ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {STATUS_LABEL.assinada}
                      </span>
                    ) : (
                      STATUS_LABEL[oc.status] ?? oc.status
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(oc.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {mostrarMenuAcoes && menuKind ? (
                        <button
                          type="button"
                          data-oc-row-trigger
                          disabled={isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowMenu(oc.id, menuKind, e.currentTarget);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          aria-expanded={rowMenu?.ocId === oc.id}
                          aria-haspopup="menu"
                        >
                          Ações
                          <ChevronDown
                            className={`size-3.5 shrink-0 text-slate-500 transition ${
                              rowMenu?.ocId === oc.id ? "rotate-180" : ""
                            }`}
                            aria-hidden
                          />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preview && previewModalProps && (
        <ComprovacaoPreviewModal
          comprovacaoId={preview.item.id}
          nomeArquivo={previewModalProps.nome}
          tipoArquivo={previewModalProps.tipo}
          open
          onClose={() => setPreview(null)}
          apiResource="ordens-compra"
          previewVersao={previewModalProps.versao}
        />
      )}

      {assinarItem && (
        <AssinarOrdemCompraModal
          open
          onClose={() => setAssinarItem(null)}
          ordemCompraId={assinarItem.id}
          nomeArquivoEnviado={assinarItem.nomeArquivo}
          demandaDescricao={assinarItem.demandaDescricao}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {menuPortalReady &&
        rowMenu &&
        menuOc &&
        createPortal(
          <div
            data-oc-row-menu
            role="menu"
            aria-orientation="vertical"
            className="fixed z-100 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            style={{
              top: rowMenu.top,
              left: rowMenu.left,
              width: ROW_MENU_WIDTH,
            }}
          >
            {rowMenu.kind === "signed-full" && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "assinada" });
                    closeRowMenu();
                  }}
                >
                  <Eye className="size-4 shrink-0 text-blue-600" aria-hidden />
                  Ver documento assinado
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  <FileText className="size-4 shrink-0 text-slate-500" aria-hidden />
                  Ver documento enviado pela agência
                </button>
                <div className="my-1 border-t border-slate-100" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    void handleDownload(menuOc, "assinada");
                    closeRowMenu();
                  }}
                >
                  <Download className="size-4 shrink-0 text-emerald-600" aria-hidden />
                  Baixar documento assinado
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  <Download className="size-4 shrink-0 text-slate-500" aria-hidden />
                  Baixar documento enviado pela agência
                </button>
              </>
            )}

            {rowMenu.kind === "signed-simple" && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  <Eye className="size-4 shrink-0 text-blue-600" aria-hidden />
                  Ver documento
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  <Download className="size-4 shrink-0 text-slate-600" aria-hidden />
                  Baixar documento
                </button>
              </>
            )}

            {rowMenu.kind === "open" && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  <Eye className="size-4 shrink-0 text-blue-600" aria-hidden />
                  Ver documento
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  <Download className="size-4 shrink-0 text-slate-600" aria-hidden />
                  Baixar documento
                </button>
                {isAdmin && (
                  <>
                    <div className="my-1 border-t border-slate-100" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                      onClick={() => {
                        setAssinarItem(menuOc);
                        closeRowMenu();
                      }}
                    >
                      <FileSignature className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      Anexar PDF assinado
                    </button>
                  </>
                )}
                {(isAdmin || isAgency) && (
                  <>
                    <div className="my-1 border-t border-slate-100" role="separator" />
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isPending}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                      onClick={() => {
                        void handleRemovePedido(menuOc);
                      }}
                    >
                      <Trash2 className="size-4 shrink-0" aria-hidden />
                      Remover pedido
                    </button>
                  </>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
