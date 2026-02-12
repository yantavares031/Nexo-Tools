import type { DashboardAgencia } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: obter dados do dashboard — faturado por agência vs capacidade anual. */
export async function getDashboardAgenciasUseCase(
  params: { agenciaId?: string } | void,
  deps: Dependencies
): Promise<DashboardAgencia[]> {
  const agenciaId = params && typeof params === "object" ? params.agenciaId : undefined;

  const [agencias, demandasFaturadas] = await Promise.all([
    deps.agenciaRepository.findAll(),
    deps.demandaRepository.findAll(
      agenciaId ? { status: "faturado", agenciaId } : { status: "faturado" }
    ),
  ]);

  const agenciasToShow = agenciaId
    ? agencias.filter((a) => a.id === agenciaId)
    : agencias;

  const faturadoByAgenciaId = new Map<string, number>();
  for (const d of demandasFaturadas) {
    const id = d.agenciaId ?? d.agencia ?? "_sem_agencia";
    const current = faturadoByAgenciaId.get(id) ?? 0;
    faturadoByAgenciaId.set(id, current + (d.valor ?? 0));
  }

  const result: DashboardAgencia[] = agenciasToShow.map((agencia) => {
    const faturado = faturadoByAgenciaId.get(agencia.id) ?? 0;
    const orcamento = agencia.orcamentoAnual || 1;
    const percentual = Math.min(100, (faturado / orcamento) * 100);
    return {
      agencia,
      faturado,
      percentual,
    };
  });

  return result.sort((a, b) => b.faturado - a.faturado);
}
