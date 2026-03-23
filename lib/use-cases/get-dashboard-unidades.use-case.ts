import type { DashboardUnidade } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: obter dados do dashboard por unidade responsável — faturado e comprometido. */
export async function getDashboardUnidadesUseCase(
  params: { agenciaId?: string } | void,
  deps: Dependencies
): Promise<DashboardUnidade[]> {
  const agenciaId = params && typeof params === "object" ? params.agenciaId : undefined;
  const demandas = await deps.demandaRepository.findAll(
    agenciaId ? { agenciaId } : undefined
  );

  const byUnidade = new Map<
    string,
    { faturado: number; comprometido: number }
  >();

  for (const d of demandas) {
    const un = d.unResponsavel?.trim() || "_sem_unidade";
    const current = byUnidade.get(un) ?? { faturado: 0, comprometido: 0 };
    const valor = d.valor ?? 0;

    if (d.status === "faturado" || d.status === "entregue") {
      current.faturado += valor;
    } else if (d.status === "comprometido") {
      current.comprometido += valor;
    }
    byUnidade.set(un, current);
  }

  const result: DashboardUnidade[] = Array.from(byUnidade.entries())
    .filter(([un]) => un !== "_sem_unidade")
    .map(([unResponsavel, { faturado, comprometido }]) => ({
      unResponsavel,
      faturado,
      comprometido,
      total: faturado + comprometido,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return result;
}
