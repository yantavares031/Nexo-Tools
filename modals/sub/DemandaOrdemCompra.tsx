"use client";

import { useEffect, useState } from "react";
import { getOrdensCompraPorDemandaAction } from "@/app/actions/ordem-compra";
import type { Demanda, OrdemCompra } from "@/types/globals";
import { toast } from "sonner";

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
        <div
          className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500"
          aria-hidden
        />
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-600">
        Nenhum pedido de ordem de compra vinculado a esta demanda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Agência vinculada à demanda:{" "}
        <span className="font-medium text-slate-800">{agenciaDemanda}</span>
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 font-semibold text-slate-800">Situação</th>
              <th className="px-3 py-2 font-semibold text-slate-800">Documento enviado</th>
              <th className="px-3 py-2 font-semibold text-slate-800">Documento assinado</th>
              <th className="px-3 py-2 font-semibold text-slate-800">Quem enviou</th>
              <th className="px-3 py-2 font-semibold text-slate-800">Data do pedido</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((oc) => {
              const temAssinado = Boolean(
                oc.caminhoArquivoAssinado && oc.nomeArquivoAssinado
              );
              return (
                <tr key={oc.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3 text-left text-slate-600">
                    {oc.status === "assinada" ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {STATUS_LABEL.assinada}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        {STATUS_LABEL.em_aberto}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-left text-slate-700">
                    <span className="line-clamp-2" title={oc.nomeArquivo}>
                      {oc.nomeArquivo}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-left text-slate-700">
                    {temAssinado ? (
                      <span className="line-clamp-2 text-emerald-800" title={oc.nomeArquivoAssinado}>
                        {oc.nomeArquivoAssinado}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-left text-slate-600">{oc.autor || "—"}</td>
                  <td className="px-3 py-3 text-left text-slate-600">
                    {formatDateTime(oc.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
