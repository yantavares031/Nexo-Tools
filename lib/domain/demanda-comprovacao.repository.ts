import type { DemandaComprovacao, DemandaComprovacaoInput } from "@/types/globals";

/** Contrato do repositório de comprovações de demanda — permite trocar implementação (mock, Prisma, etc.). */
export interface IDemandaComprovacaoRepository {
  findByDemandaId(demandaId: string): Promise<DemandaComprovacao[]>;
  findById(id: string): Promise<DemandaComprovacao | null>;
  create(input: DemandaComprovacaoInput): Promise<DemandaComprovacao>;
  remove(id: string): Promise<void>;
  /** Retorna IDs de demandas que têm pelo menos uma comprovação */
  findDemandaIdsWithComprovacoes(agenciaId: string): Promise<string[]>;
}
