import type { DemandaMensagem, DemandaMensagemInput } from "@/types/globals";

/** Contrato do repositório de mensagens de demanda — permite trocar implementação (mock, Prisma, etc.). */
export interface IDemandaMensagemRepository {
  findByDemandaId(demandaId: string): Promise<DemandaMensagem[]>;
  create(input: DemandaMensagemInput): Promise<DemandaMensagem>;
}
