import type { Certidao, CertidaoInput } from "@/types/globals";

export interface CertidaoFilters {
  agenciaId?: string;
  /** Mês/ano do envio (createdAt), formato YYYY-MM. */
  mes?: string;
  q?: string;
}

export interface CertidaoPagination {
  page: number;
  limit: number;
}

export interface CertidaoPaginatedResult {
  items: Certidao[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICertidaoRepository {
  findPaginated(
    filters: CertidaoFilters | undefined,
    pagination: CertidaoPagination
  ): Promise<CertidaoPaginatedResult>;
  findById(id: string): Promise<Certidao | null>;
  create(input: CertidaoInput): Promise<Certidao>;
  remove(id: string): Promise<void>;
}
