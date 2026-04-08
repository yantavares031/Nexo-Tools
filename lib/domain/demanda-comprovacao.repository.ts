import type { Comprovacao, ComprovacaoInput } from "@/types/globals";

/** Item da lista de comprovações com quantidade de demandas vinculadas. */
export interface ComprovacaoListItem extends Comprovacao {
  demandaCount: number;
}

export interface ComprovacaoPagination {
  page: number;
  limit: number;
}

export interface ComprovacaoPaginatedResult {
  items: ComprovacaoListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Contrato do repositório de comprovações — permite trocar implementação (mock, Prisma, etc.). */
export type ComprovacaoAgenciaFilters = {
  agenciaId?: string;
  /** Ver DemandaFilters.agenciaNomeLegacy — demandas só com nome fantasia. */
  agenciaNomeLegacy?: string;
  q?: string;
};

export interface IDemandaComprovacaoRepository {
  findAll(filters?: ComprovacaoAgenciaFilters): Promise<ComprovacaoListItem[]>;
  findPaginated(
    filters: ComprovacaoAgenciaFilters | undefined,
    pagination: ComprovacaoPagination
  ): Promise<ComprovacaoPaginatedResult>;
  findByDemandaId(demandaId: string): Promise<Comprovacao[]>;
  findById(id: string): Promise<Comprovacao | null>;
  findDemandaIdsByComprovacaoId(comprovacaoId: string): Promise<string[]>;
  /** Cria comprovação e vincula às demandas informadas (modelo N:M). */
  create(input: ComprovacaoInput, demandaIds: string[]): Promise<Comprovacao>;
  /** Remove apenas o vínculo N:M entre demanda e comprovação. */
  unlinkDemanda(comprovacaoId: string, demandaId: string): Promise<void>;
  remove(id: string): Promise<void>;
  /** Retorna IDs de demandas que têm pelo menos uma comprovação. */
  findDemandaIdsWithComprovacoes(filters: {
    agenciaId: string;
    agenciaNomeLegacy?: string;
  }): Promise<string[]>;
}
