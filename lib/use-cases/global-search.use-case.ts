import type { Agencia, Demanda, Solicitante, UserRole } from "@/types/globals";
import type { DemandaFilters, IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { ISolicitanteRepository } from "@/lib/domain/solicitante.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { canAccessRoute } from "@/lib/roles";

const LIMIT_PER_GROUP = 6;

type Input = {
  term: string;
  role: UserRole;
  /** Escopo do usuário agency: restringe as demandas às da própria agência. */
  agencyScope?: Pick<DemandaFilters, "agenciaId" | "agenciaNomeLegacy">;
};

type Dependencies = {
  demandaRepository: IDemandaRepository;
  solicitanteRepository: ISolicitanteRepository;
  agenciaRepository: IAgenciaRepository;
};

export type GlobalSearchResult = {
  demandas: Demanda[];
  solicitantes: Solicitante[];
  agencias: Agencia[];
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Caso de uso: busca rápida (Cmd+K) em demandas, solicitantes e agências, respeitando o perfil. */
export async function globalSearchUseCase(input: Input, deps: Dependencies): Promise<GlobalSearchResult> {
  const term = input.term.trim();
  const pagination = { page: 1, limit: LIMIT_PER_GROUP };

  const [demandas, solicitantes, agencias] = await Promise.all([
    deps.demandaRepository
      .findPaginated({ search: term, ...input.agencyScope }, pagination)
      .then((result) => result.items),
    canAccessRoute(input.role, "/solicitantes")
      ? deps.solicitanteRepository.findPaginated({ q: term }, pagination).then((result) => result.items)
      : Promise.resolve([]),
    canAccessRoute(input.role, "/agencias")
      ? deps.agenciaRepository
          .findAll()
          .then((items) =>
            items
              .filter((agencia) => normalize(agencia.nomeFantasia).includes(normalize(term)) || agencia.cnpj.includes(term))
              .slice(0, LIMIT_PER_GROUP),
          )
      : Promise.resolve([]),
  ]);

  return { demandas, solicitantes, agencias };
}
