import type { Solicitante, SolicitanteInput } from "@/types/globals";

export interface SolicitantePagination {
  page: number;
  limit: number;
}

export interface SolicitantePaginatedResult {
  items: Solicitante[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Contrato do repositório de solicitantes. */
export interface ISolicitanteRepository {
  findAll(): Promise<Solicitante[]>;
  findPaginated(
    filters: { q?: string } | undefined,
    pagination: SolicitantePagination
  ): Promise<SolicitantePaginatedResult>;
  findById(id: string): Promise<Solicitante | null>;
  create(input: SolicitanteInput): Promise<Solicitante>;
  update(id: string, input: Partial<Pick<Solicitante, "nome" | "unResponsavel">>): Promise<void>;
  remove(id: string): Promise<void>;
}
