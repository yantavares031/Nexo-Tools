"use client";

import { useEffect, useState } from "react";
import { getOrdensCompraPorDemandaAction } from "@/app/actions/ordem-compra";
import type { Demanda, OrdemCompra } from "@/types/globals";
import { toast } from "sonner";
import { FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";

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
  em_aberto: "Enviada (em aberto)",
  assinada: "Assinada",
};

interface DemandaOrdemCompraProps {
  demanda: Demanda;
  demandaId: string;
}

export function DemandaOrdemCompra({ demanda, demandaId }: DemandaOrdemCompraProps) {
  const [lista, setLista] = useState<OrdemCompra[]>([]);
  const [loading, setLoading] = useState(true);

  const agenciaDemanda =
    (demanda.agencia && demanda.agencia.trim() !== "" ? demanda.agencia : null) ?? "—";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const rows = await getOrdensCompraPorDemandaAction(demandaId);
        if (!cancelled) setLista(rows);
      } catch {
        if (!cancelled) {
          toast.error("Erro ao carregar ordens de compra.");
          setLista([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [demandaId]);

  if (loading) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 py-8">
        <Spinner className="size-8 text-neutral-400" />
        <p className="text-sm text-neutral-500">Carregando...</p>
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <EmptyState
        icon={<FileSignature aria-hidden />}
        title="Nenhuma ordem de compra"
        description="Nenhum pedido de ordem de compra vinculado a esta demanda."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-neutral-600">
        Agência vinculada à demanda: <span className="font-medium text-neutral-950">{agenciaDemanda}</span>
      </p>
      <Table className="min-w-[640px]">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Situação</TableHeaderCell>
            <TableHeaderCell>Documento enviado</TableHeaderCell>
            <TableHeaderCell>Documento assinado</TableHeaderCell>
            <TableHeaderCell>Quem enviou</TableHeaderCell>
            <TableHeaderCell>Data do pedido</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lista.map((oc) => {
            const temAssinado = Boolean(oc.caminhoArquivoAssinado && oc.nomeArquivoAssinado);
            return (
              <TableRow key={oc.id}>
                <TableCell>
                  {oc.status === "assinada" ? (
                    <Badge tone="success">{STATUS_LABEL.assinada}</Badge>
                  ) : (
                    <Badge tone="warning">{STATUS_LABEL.em_aberto}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-neutral-700">
                  <span className="line-clamp-2" title={oc.nomeArquivo}>
                    {oc.nomeArquivo}
                  </span>
                </TableCell>
                <TableCell className="text-neutral-700">
                  {temAssinado ? (
                    <span className="line-clamp-2" title={oc.nomeArquivoAssinado}>
                      {oc.nomeArquivoAssinado}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </TableCell>
                <TableCell>{oc.autor || "—"}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(oc.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
