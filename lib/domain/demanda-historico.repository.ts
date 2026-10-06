import type { DemandaHistorico, DemandaHistoricoInput } from "@/types/globals";

export interface IDemandaHistoricoRepository {
  /** Eventos da demanda, mais recentes primeiro. */
  findByDemandaId(demandaId: string): Promise<DemandaHistorico[]>;
  create(input: DemandaHistoricoInput): Promise<DemandaHistorico>;
}
