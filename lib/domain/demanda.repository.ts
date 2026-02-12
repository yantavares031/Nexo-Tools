import type { Demanda, DemandaInput } from "@/types/globals";

export interface DemandaFilters {
  search?: string;
  solicitante?: string;
  unResponsavel?: string;
  status?: string;
  agencia?: string;
  /** Filtra por ID da agência (ex.: para usuário agency ver só as demandas dele). */
  agenciaId?: string;
}

export interface DemandaPagination {
  page: number;
  limit: number;
}

export interface DemandaPaginatedResult {
  items: Demanda[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SolicitanteComUnidade {
  nome: string;
  unResponsavel: string;
}

export interface DemandaFilterOptions {
  solicitantes: string[];
  solicitantesComUnidade: SolicitanteComUnidade[];
  unResponsaveis: string[];
  statuses: string[];
  agencias: string[];
}

/** Contrato do repositório de demandas — permite trocar implementação (mock, Prisma, etc.). */
export interface IDemandaRepository {
  findAll(filters?: DemandaFilters): Promise<Demanda[]>;
  findPaginated(
    filters: DemandaFilters | undefined,
    pagination: DemandaPagination
  ): Promise<DemandaPaginatedResult>;
  findById(id: string): Promise<Demanda | null>;
  getFilterOptions(filters?: DemandaFilters): Promise<DemandaFilterOptions>;
  create(input: DemandaInput): Promise<Demanda>;
  update(id: string, input: DemandaInput): Promise<Demanda>;
  remove(id: string): Promise<void>;
}
