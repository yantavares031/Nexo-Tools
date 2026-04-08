import type { OrdemCompra, OrdemCompraCreateInput, OrdemCompraStatus } from "@/types/globals";

/** Metadados do PDF assinado gravados ao concluir o fluxo de assinatura. */
export type OrdemCompraRegistrarAssinaturaInput = {
  nomeArquivoAssinado: string;
  tipoArquivoAssinado: string;
  tamanhoAssinado: number;
  caminhoArquivoAssinado: string;
};

export interface OrdemCompraListItem extends OrdemCompra {
  demandaDescricao: string;
  /** Código OC/PI da demanda vinculada. */
  demandaOcPi: string;
}

export interface OrdemCompraPagination {
  page: number;
  limit: number;
}

export interface OrdemCompraPaginatedResult {
  items: OrdemCompraListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type OrdemCompraAgenciaFilters = {
  agenciaId?: string;
  /** Ver DemandaFilters.agenciaNomeLegacy — demandas só com nome fantasia. */
  agenciaNomeLegacy?: string;
  status?: OrdemCompraStatus;
  q?: string;
};

export interface IOrdemCompraRepository {
  create(input: OrdemCompraCreateInput): Promise<OrdemCompra>;
  findById(id: string): Promise<OrdemCompra | null>;
  /** Pedidos de OC vinculados à demanda, mais recentes primeiro. */
  findByDemandaId(demandaId: string): Promise<OrdemCompra[]>;
  /** Demandas que já possuem pelo menos uma OC com status assinada. */
  findDemandaIdsComOrdemCompraAssinada(): Promise<string[]>;
  findPaginated(
    filters: OrdemCompraAgenciaFilters | undefined,
    pagination: OrdemCompraPagination
  ): Promise<OrdemCompraPaginatedResult>;
  registrarAssinaturaComArquivo(id: string, input: OrdemCompraRegistrarAssinaturaInput): Promise<void>;
  /** Remove registro e arquivos no storage (R2 ou legado). */
  remove(id: string): Promise<void>;
}
