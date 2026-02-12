import type { Demanda } from "@/types/globals";
import type {
  IDemandaRepository,
  DemandaFilters,
  DemandaFilterOptions,
  DemandaPagination,
  DemandaPaginatedResult,
} from "@/lib/domain/demanda.repository";
import type { DemandaInput } from "@/types/globals";

import demandasData from "@/data/demandas.mock.json";
import unidadesData from "@/data/unidades.mock.json";

/** Array mutável para o mock — permite adicionar demandas em memória. */
const demandas = [...(demandasData as Demanda[])];
const unidades = unidadesData as string[];

/** Aplica filtros à lista de demandas (lógica compartilhada). */
function applyFilters(list: Demanda[], filters?: DemandaFilters): Demanda[] {
  let result = [...list];
  if (filters?.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    result = result.filter(
      (d) =>
        d.demanda.toLowerCase().includes(term) ||
        (d.ocPi?.toLowerCase().includes(term) ?? false)
    );
  }
  if (filters?.solicitante) {
    result = result.filter((d) => d.solicitante === filters.solicitante);
  }
  if (filters?.unResponsavel) {
    result = result.filter((d) => d.unResponsavel === filters.unResponsavel);
  }
  if (filters?.status) {
    result = result.filter((d) => d.status === filters.status);
  }
  if (filters?.agencia) {
    result = result.filter((d) => d.agencia === filters.agencia);
  }
  if (filters?.agenciaId) {
    result = result.filter((d) => d.agenciaId === filters.agenciaId);
  }
  return result;
}

/** Implementação mock do repositório — usa JSON local. Depois trocar por Prisma/SQL/etc. */
export class DemandaMockRepository implements IDemandaRepository {
  async findAll(filters?: DemandaFilters): Promise<Demanda[]> {
    return applyFilters(demandas, filters);
  }

  async findPaginated(
    filters: DemandaFilters | undefined,
    pagination: DemandaPagination
  ): Promise<DemandaPaginatedResult> {
    const filtered = applyFilters(demandas, filters);
    const total = filtered.length;
    const { page, limit } = pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const pageSafe = Math.max(1, Math.min(page, totalPages));
    const start = (pageSafe - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total,
      page: pageSafe,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<Demanda | null> {
    return demandas.find((d) => d.id === id) ?? null;
  }

  async getFilterOptions(filters?: DemandaFilters): Promise<DemandaFilterOptions> {
    const base = filters ? applyFilters(demandas, filters) : demandas;
    const solicitantes = [...new Set(base.map((d) => d.solicitante))].sort();
    const statuses = [...new Set(base.map((d) => d.status))].sort();

    return {
      solicitantes,
      solicitantesComUnidade: [],
      unResponsaveis: [...unidades].sort(),
      statuses,
      agencias: [],
    };
  }

  async create(input: DemandaInput): Promise<Demanda> {
    const id = String(Date.now());
    const now = new Date().toISOString();
    const demanda: Demanda = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    demandas.push(demanda);
    return demanda;
  }

  async update(id: string, input: DemandaInput): Promise<Demanda> {
    const index = demandas.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Demanda não encontrada");
    const now = new Date().toISOString();
    const demanda: Demanda = {
      ...input,
      id,
      updatedAt: now,
      createdAt: demandas[index].createdAt ?? now,
    };
    demandas[index] = demanda;
    return demanda;
  }

  async remove(id: string): Promise<void> {
    const index = demandas.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Demanda não encontrada");
    demandas.splice(index, 1);
  }
}
