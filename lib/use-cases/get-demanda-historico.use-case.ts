import type { DemandaHistorico } from "@/types/globals";
import type { IDemandaHistoricoRepository } from "@/lib/domain/demanda-historico.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import {
  demandaMatchesAgenciaScope,
  type AgencyDemandaScope,
} from "@/lib/agency-demanda-scope";

type Dependencies = {
  demandaHistoricoRepository: IDemandaHistoricoRepository;
  demandaRepository: IDemandaRepository;
};

/**
 * Linha do tempo da demanda. Agências só veem demandas do próprio escopo.
 * Demandas sem evento de criação registrado (anteriores ao histórico) recebem
 * um evento sintetizado a partir da data de cadastro.
 */
export async function getDemandaHistoricoUseCase(
  demandaId: string,
  agencyScope: AgencyDemandaScope | null,
  deps: Dependencies
): Promise<DemandaHistorico[]> {
  const demanda = await deps.demandaRepository.findById(demandaId);
  if (!demanda) return [];
  if (agencyScope && !demandaMatchesAgenciaScope(demanda, agencyScope)) return [];

  const eventos = await deps.demandaHistoricoRepository.findByDemandaId(demandaId);
  const hasCriada = eventos.some((e) => e.tipo === "criada");
  if (hasCriada || !demanda.createdAt) return eventos;

  return [
    ...eventos,
    {
      id: `criada-${demanda.id}`,
      demandaId: demanda.id,
      tipo: "criada",
      descricao: "Demanda cadastrada",
      alteracoes: [],
      autor: "",
      autorUserId: null,
      createdAt: demanda.createdAt,
    },
  ];
}
