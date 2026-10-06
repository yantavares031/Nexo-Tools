"use client";

import { useState, useEffect, useCallback, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { OrdemCompraListItem } from "@/lib/domain/ordem-compra.repository";
import { removeOrdemCompraEmAbertoAction } from "@/app/actions/ordem-compra";
import { toast } from "sonner";
import { Download, Eye, FileSignature, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { ComprovacaoPreviewModal } from "@/modals/sub/ComprovacaoPreviewModal";
import { AssinarOrdemCompraModal } from "@/modals/AssinarOrdemCompraModal";
import { useEscapeKey } from "@/lib/use-escape-key";
import { cn } from "@/lib/cn";
import { useConfirm } from "@/components/confirm-provider";
import { UserAvatarThumb } from "@/components/UserAvatarThumb";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { OrdensCompraTab } from "./hrefs";

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
  emptyMessage?: string;
}

type PreviewState = {
  item: OrdemCompraListItem;
  versao: "original" | "assinada";
};

function RowMenuItem({
  icon,
  danger = false,
  disabled,
  onClick,
  children,
}: {
  icon: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[calc(var(--radius-field)-2px)] px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-neutral-700 hover:bg-neutral-100 [&_svg]:text-neutral-400",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function RowMenuSeparator() {
  return <div className="my-1 h-px bg-neutral-100" role="separator" />;
}

export function OrdensCompraTable({ ordens, userRole, tab, emptyMessage }: OrdensCompraTableProps) {
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
    if (kind === "signed-full") return isAdmin ? 300 : 248;
    if (kind === "signed-simple") return isAdmin ? 148 : 96;
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

  const defaultEmptyMessage =
    tab === "abertas" ? "Nenhum pedido em aberto." : "Nenhuma OC assinada registrada ainda.";

  return (
    <>
      <Table className="min-w-[880px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Documento</TableHeaderCell>
            <TableHeaderCell>Demanda</TableHeaderCell>
            <TableHeaderCell>OC/PI</TableHeaderCell>
            <TableHeaderCell>Autor</TableHeaderCell>
            <TableHeaderCell className="w-28">Status</TableHeaderCell>
            <TableHeaderCell className="w-36">Data</TableHeaderCell>
            <TableHeaderCell className="w-14">
              <span className="sr-only">Ações</span>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordens.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-neutral-500">
                {emptyMessage ?? defaultEmptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            ordens.map((oc) => {
              const temAssinada = ocTemPdfAssinado(oc);
              const isAssinada = oc.status === "assinada";
              const usarMenuSignedFull = tab === "assinadas" && temAssinada;
              const usarMenuSignedSimple = tab === "assinadas" && isAssinada && !temAssinada;
              const usarMenuOpen = tab === "abertas" && oc.status === "em_aberto";

              const menuKind: OcRowMenuKind | null = usarMenuSignedFull
                ? "signed-full"
                : usarMenuSignedSimple
                  ? "signed-simple"
                  : usarMenuOpen
                    ? "open"
                    : null;

              return (
                <TableRow key={oc.id} className="transition-colors hover:bg-sky-50/60">
                  <TableCell className="max-w-72">
                    <p className="truncate font-medium text-neutral-950" title={oc.nomeArquivo}>
                      {oc.nomeArquivo}
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-400 tabular-nums">
                      {formatFileSize(oc.tamanho)}
                    </p>
                    {tab === "assinadas" && temAssinada && oc.nomeArquivoAssinado && (
                      <p
                        className="mt-0.5 truncate text-[11px] text-lime-700"
                        title={oc.nomeArquivoAssinado}
                      >
                        Assinada: {oc.nomeArquivoAssinado}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-60">
                    <p className="truncate text-link" title={oc.demandaDescricao}>
                      {oc.demandaDescricao || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-36">
                    {oc.demandaOcPi ? (
                      <p className="truncate tabular-nums" title={oc.demandaOcPi}>
                        {oc.demandaOcPi}
                      </p>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserAvatarThumb userId={oc.cadastradoPorUserId} label={oc.autor} />
                      <span className="truncate">{oc.autor}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={isAssinada ? "success" : "neutral"}>
                      {STATUS_LABEL[oc.status] ?? oc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDateTime(oc.createdAt)}
                  </TableCell>
                  <TableCell>
                    {menuKind && (
                      <IconButton
                        aria-label="Ações"
                        data-oc-row-trigger
                        disabled={isPending}
                        aria-expanded={rowMenu?.ocId === oc.id}
                        aria-haspopup="menu"
                        className={cn(rowMenu?.ocId === oc.id && "bg-neutral-100 text-neutral-800")}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowMenu(oc.id, menuKind, e.currentTarget);
                        }}
                      >
                        <MoreHorizontal />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
            className="fixed z-100 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg shadow-neutral-900/8"
            style={{
              top: rowMenu.top,
              left: rowMenu.left,
              width: ROW_MENU_WIDTH,
            }}
          >
            {rowMenu.kind === "signed-full" && (
              <>
                <RowMenuItem
                  icon={<Eye aria-hidden />}
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "assinada" });
                    closeRowMenu();
                  }}
                >
                  Ver documento assinado
                </RowMenuItem>
                <RowMenuItem
                  icon={<FileText aria-hidden />}
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  Ver documento enviado pela agência
                </RowMenuItem>
                <RowMenuSeparator />
                <RowMenuItem
                  icon={<Download aria-hidden />}
                  onClick={() => {
                    void handleDownload(menuOc, "assinada");
                    closeRowMenu();
                  }}
                >
                  Baixar documento assinado
                </RowMenuItem>
                <RowMenuItem
                  icon={<Download aria-hidden />}
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  Baixar documento enviado pela agência
                </RowMenuItem>
                {isAdmin && (
                  <>
                    <RowMenuSeparator />
                    <RowMenuItem
                      icon={<Trash2 aria-hidden />}
                      danger
                      disabled={isPending}
                      onClick={() => {
                        void handleRemovePedido(menuOc);
                      }}
                    >
                      Remover pedido
                    </RowMenuItem>
                  </>
                )}
              </>
            )}

            {rowMenu.kind === "signed-simple" && (
              <>
                <RowMenuItem
                  icon={<Eye aria-hidden />}
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  Ver documento
                </RowMenuItem>
                <RowMenuItem
                  icon={<Download aria-hidden />}
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  Baixar documento
                </RowMenuItem>
                {isAdmin && (
                  <>
                    <RowMenuSeparator />
                    <RowMenuItem
                      icon={<Trash2 aria-hidden />}
                      danger
                      disabled={isPending}
                      onClick={() => {
                        void handleRemovePedido(menuOc);
                      }}
                    >
                      Remover pedido
                    </RowMenuItem>
                  </>
                )}
              </>
            )}

            {rowMenu.kind === "open" && (
              <>
                <RowMenuItem
                  icon={<Eye aria-hidden />}
                  onClick={() => {
                    setPreview({ item: menuOc, versao: "original" });
                    closeRowMenu();
                  }}
                >
                  Ver documento
                </RowMenuItem>
                <RowMenuItem
                  icon={<Download aria-hidden />}
                  onClick={() => {
                    void handleDownload(menuOc, "original");
                    closeRowMenu();
                  }}
                >
                  Baixar documento
                </RowMenuItem>
                {isAdmin && (
                  <>
                    <RowMenuSeparator />
                    <RowMenuItem
                      icon={<FileSignature aria-hidden />}
                      onClick={() => {
                        setAssinarItem(menuOc);
                        closeRowMenu();
                      }}
                    >
                      Anexar PDF assinado
                    </RowMenuItem>
                  </>
                )}
                {(isAdmin || isAgency) && (
                  <>
                    <RowMenuSeparator />
                    <RowMenuItem
                      icon={<Trash2 aria-hidden />}
                      danger
                      disabled={isPending}
                      onClick={() => {
                        void handleRemovePedido(menuOc);
                      }}
                    >
                      Remover pedido
                    </RowMenuItem>
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
