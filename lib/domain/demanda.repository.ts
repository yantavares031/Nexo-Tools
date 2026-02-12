import type { Demanda, DemandaInput } from "@/types/globals";

export interface DemandaFilters {
  search?: string;
  solicitante?: string;
  unResponsavel?: string;
  status?: string;
  agencia?: string;
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
  findById(id: string): Promise<Demanda | null>;
  getFilterOptions(): Promise<DemandaFilterOptions>;
  create(input: DemandaInput): Promise<Demanda>;
  update(id: string, input: DemandaInput): Promise<Demanda>;
  remove(id: string): Promise<void>;
}
