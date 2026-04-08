import type { Demanda, DemandaInput } from "@/types/globals";

export interface DemandaFilters {
  search?: string;
  solicitante?: string;
  unResponsavel?: string;
  status?: string;
  /** Filtra por múltiplos status (ex.: ['entregue','comprometido']). Ignorado se status estiver definido. */
  statusIn?: string[];
  agencia?: string;
  /** Mês/ano no formato YYYY-MM (ex.: 2026-02). */
  mes?: string;
  /** "comprovado" = com ao menos uma comprovação; "nao_comprovado" = sem comprovações. */
  comprovacao?: "comprovado" | "nao_comprovado";
  /** Filtra por ID da agência (ex.: para usuário agency ver só as demandas dele). */
  agenciaId?: string;
  /**
   * Com agenciaId: inclui demandas antigas sem agenciaId cujo campo texto `agencia`
   * coincide com o nome fantasia (ex.: cadastro/importação só preenchia o nome).
   */
  agenciaNomeLegacy?: string;
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
  /** Mapeamento board nome → agência nome (para pré-seleção na importação Deskfy). */
  agenciaPorBoard?: Record<string, string>;
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
