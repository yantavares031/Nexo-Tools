"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  FilePlus2,
  FileSignature,
  FileX2,
  History,
  PencilLine,
  PieChart,
  PlusCircle,
  type LucideProps,
} from "lucide-react";
import { toast } from "sonner";
import { getDemandaHistoricoAction } from "@/app/actions/demanda";
import type { DemandaHistorico, DemandaHistoricoTipo } from "@/types/globals";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

const EVENT_STYLE: Record<
  DemandaHistoricoTipo,
  { icon: ComponentType<LucideProps>; className: string }
> = {
  criada: { icon: PlusCircle, className: "bg-sky-50 text-sky-600 ring-sky-100" },
  alterada: { icon: PencilLine, className: "bg-amber-50 text-amber-600 ring-amber-100" },
  comprovacao_adicionada: { icon: FilePlus2, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  comprovacao_removida: { icon: FileX2, className: "bg-red-50 text-red-600 ring-red-100" },
  ordem_compra_enviada: { icon: FileSignature, className: "bg-violet-50 text-violet-600 ring-violet-100" },
  ordem_compra_assinada: { icon: FileSignature, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  ordem_compra_removida: { icon: FileX2, className: "bg-red-50 text-red-600 ring-red-100" },
  centros_custo_alterados: { icon: PieChart, className: "bg-amber-50 text-amber-600 ring-amber-100" },
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface DemandaHistoricoTimelineProps {
  demandaId: string;
}

export function DemandaHistoricoTimeline({ demandaId }: DemandaHistoricoTimelineProps) {
  const [eventos, setEventos] = useState<DemandaHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDemandaHistoricoAction(demandaId)
      .then((rows) => {
        if (!cancelled) setEventos(rows);
      })
      .catch(() => {
        if (!cancelled) toast.error("Erro ao carregar o histórico da demanda.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [demandaId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 py-8">
        <Spinner className="size-8 text-neutral-400" />
        <p className="text-sm text-neutral-500">Carregando...</p>
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <EmptyState
        icon={<History aria-hidden />}
        title="Nenhum evento registrado"
        description="As alterações de status, valores, anexos e responsáveis aparecerão aqui."
      />
    );
  }

  return (
    <ol className="relative space-y-5">
      {eventos.map((evento, index) => {
        const style = EVENT_STYLE[evento.tipo] ?? EVENT_STYLE.alterada;
        const Icon = style.icon;
        const isLast = index === eventos.length - 1;
        return (
          <li key={evento.id} className="relative flex gap-3">
            {!isLast && (
              <span aria-hidden className="absolute top-9 bottom-[-20px] left-[15px] w-px bg-neutral-200" />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4",
                style.className
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-[13px] font-semibold text-neutral-950">{evento.descricao}</p>
                <span className="text-[11px] text-neutral-500 tabular-nums">
                  {formatDateTime(evento.createdAt)}
                </span>
              </div>
              {evento.autor && (
                <p className="text-xs text-neutral-500">por {evento.autor}</p>
              )}
              {evento.alteracoes.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2">
                  {evento.alteracoes.map((alteracao) => (
                    <li
                      key={alteracao.campo}
                      className="flex flex-wrap items-center gap-x-1.5 text-xs text-neutral-700"
                    >
                      <span className="font-medium text-neutral-950">{alteracao.campo}:</span>
                      {alteracao.de && (
                        <>
                          <span className="text-neutral-500 line-through decoration-neutral-300">
                            {alteracao.de}
                          </span>
                          <ArrowRight className="size-3 shrink-0 text-neutral-400" aria-hidden />
                        </>
                      )}
                      <span>{alteracao.para || "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
