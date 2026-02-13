import type { DemandaCentroCusto, DemandaCentroCustoInput } from "@/types/globals";

export interface IDemandaCentroCustoRepository {
  findByDemandaId(demandaId: string): Promise<DemandaCentroCusto[]>;
  create(input: DemandaCentroCustoInput): Promise<DemandaCentroCusto>;
  remove(id: string): Promise<void>;
  removeByDemandaId(demandaId: string): Promise<void>;
}
