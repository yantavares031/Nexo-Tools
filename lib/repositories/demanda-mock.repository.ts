import type { Demanda } from "@/types/globals";
import type {
  IDemandaRepository,
  DemandaFilters,
  DemandaFilterOptions,
} from "@/lib/domain/demanda.repository";
import type { DemandaInput } from "@/types/globals";

import demandasData from "@/data/demandas.mock.json";
import unidadesData from "@/data/unidades.mock.json";

/** Array mutável para o mock — permite adicionar demandas em memória. */
const demandas = [...(demandasData as Demanda[])];
const unidades = unidadesData as string[];

/** Implementação mock do repositório — usa JSON local. Depois trocar por Prisma/SQL/etc. */
export class DemandaMockRepository implements IDemandaRepository {
  async findAll(filters?: DemandaFilters): Promise<Demanda[]> {
    let list = [...demandas];

    if (filters?.search?.trim()) {
      const term = filters.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.demanda.toLowerCase().includes(term) ||
          (d.ocPi?.toLowerCase().includes(term) ?? false)
      );
    }

    if (filters?.solicitante) {
      list = list.filter((d) => d.solicitante === filters.solicitante);
    }
    if (filters?.unResponsavel) {
      list = list.filter((d) => d.unResponsavel === filters.unResponsavel);
    }
    if (filters?.status) {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.agencia) {
      list = list.filter((d) => d.agencia === filters.agencia);
    }

    return list;
  }

  async findById(id: string): Promise<Demanda | null> {
    return demandas.find((d) => d.id === id) ?? null;
  }

  async getFilterOptions(): Promise<DemandaFilterOptions> {
    const solicitantes = [...new Set(demandas.map((d) => d.solicitante))].sort();
    const statuses = [...new Set(demandas.map((d) => d.status))].sort();

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
