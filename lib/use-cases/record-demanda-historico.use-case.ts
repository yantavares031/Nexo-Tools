import type {
  Demanda,
  DemandaHistoricoAlteracao,
  DemandaHistoricoTipo,
  DemandaInput,
  HistoricoActor,
} from "@/types/globals";
import type { IDemandaHistoricoRepository } from "@/lib/domain/demanda-historico.repository";
import { formatBrazilianCurrency } from "@/lib/currency";
import { logUseCaseError } from "@/lib/server-action-log";

/** Dependência opcional dos use cases que registram eventos na linha do tempo. */
export type HistoricoDeps = {
  repository: IDemandaHistoricoRepository;
  actor: HistoricoActor;
};

const STATUS_LABELS: Record<Demanda["status"], string> = {
  comprometido: "Comprometido",
  entregue: "Entregue",
  faturado: "Faturado",
};

export function formatStatusLabel(status: Demanda["status"]): string {
  return STATUS_LABELS[status] ?? status;
}

function formatMes(mes: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(mes.trim());
  return match ? `${match[2]}/${match[1]}` : mes;
}

type TrackedField = {
  campo: string;
  read: (d: DemandaInput) => string;
};

const TRACKED_FIELDS: TrackedField[] = [
  { campo: "Status", read: (d) => formatStatusLabel(d.status) },
  { campo: "Valor", read: (d) => `R$ ${formatBrazilianCurrency(d.valor)}` },
  { campo: "Demanda", read: (d) => d.demanda.trim() },
  { campo: "Solicitante", read: (d) => d.solicitante.trim() },
  { campo: "Un. responsável", read: (d) => d.unResponsavel.trim() },
  { campo: "Agência", read: (d) => (d.agencia ?? "").trim() },
  { campo: "Centro de custo", read: (d) => d.centroDeCusto.trim() },
  { campo: "OC/PI", read: (d) => d.ocPi.trim() },
  { campo: "Mês", read: (d) => formatMes(d.mes) },
  { campo: "Observações", read: (d) => d.obs.trim() },
];

export function diffDemandaFields(
  before: DemandaInput,
  after: DemandaInput
): DemandaHistoricoAlteracao[] {
  return TRACKED_FIELDS.flatMap(({ campo, read }) => {
    const de = read(before);
    const para = read(after);
    return de === para ? [] : [{ campo, de, para }];
  });
}

/**
 * Registra um evento na linha do tempo da demanda.
 * Falhas são apenas logadas: o histórico nunca pode impedir a operação principal.
 */
export async function recordDemandaHistoricoUseCase(
  entry: {
    demandaId: string;
    tipo: DemandaHistoricoTipo;
    descricao: string;
    alteracoes?: DemandaHistoricoAlteracao[];
  },
  deps: HistoricoDeps | undefined
): Promise<void> {
  if (!deps) return;
  try {
    await deps.repository.create({
      demandaId: entry.demandaId,
      tipo: entry.tipo,
      descricao: entry.descricao,
      alteracoes: entry.alteracoes ?? [],
      autor: deps.actor.name.trim() || "Sistema",
      autorUserId: deps.actor.userId?.trim() || null,
    });
  } catch (err) {
    await logUseCaseError("recordDemandaHistoricoUseCase", err, {
      demandaId: entry.demandaId,
      tipo: entry.tipo,
    });
  }
}
