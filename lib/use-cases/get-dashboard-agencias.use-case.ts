import type { DashboardAgencia } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { yearOfMonthYear } from "@/lib/month-year";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
};

const CAPACITY_TIMEZONE = "America/Sao_Paulo";

/** Ano corrente no fuso de São Paulo: a capacidade anual zera na virada do ano. */
export function currentCapacityYear(date: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: CAPACITY_TIMEZONE, year: "numeric" }).format(date));
}

/** Ano em que a demanda conta para a capacidade: mês de referência; sem mês reconhecível, data de cadastro. */
function demandaCapacityYear(demanda: { mes: string; createdAt?: string }): number | null {
  const fromMes = yearOfMonthYear(demanda.mes);
  if (fromMes) return fromMes;
  if (!demanda.createdAt) return null;
  const created = new Date(demanda.createdAt);
  return Number.isNaN(created.getTime()) ? null : currentCapacityYear(created);
}

/** Caso de uso: obter dados do dashboard — faturado no ano por agência vs capacidade anual. */
export async function getDashboardAgenciasUseCase(
  params: { agenciaId?: string; agenciaNomeLegacy?: string; year?: number } | void,
  deps: Dependencies
): Promise<DashboardAgencia[]> {
  const agenciaId = params && typeof params === "object" ? params.agenciaId : undefined;
  const agenciaNomeLegacy =
    params && typeof params === "object" ? params.agenciaNomeLegacy : undefined;
  const year = (params && typeof params === "object" ? params.year : undefined) ?? currentCapacityYear();

  const [agencias, todasFaturadas] = await Promise.all([
    deps.agenciaRepository.findAll(),
    deps.demandaRepository.findAll(
      agenciaId
        ? { status: "faturado", agenciaId, agenciaNomeLegacy }
        : { status: "faturado" }
    ),
  ]);
  const demandasFaturadas = todasFaturadas.filter((d) => demandaCapacityYear(d) === year);

  const agenciasToShow = agenciaId
    ? agencias.filter((a) => a.id === agenciaId)
    : agencias;

  // Criar mapa de nome da agência para ID para fazer lookup
  const agenciaNameToId = new Map<string, string>();
  for (const agencia of agencias) {
    agenciaNameToId.set(agencia.nomeFantasia, agencia.id);
  }

  const faturadoByAgenciaId = new Map<string, number>();
  for (const d of demandasFaturadas) {
    // Normalizar: usar agenciaId se disponível, senão converter nome para ID
    let agenciaKey: string;
    if (d.agenciaId) {
      agenciaKey = d.agenciaId;
    } else if (d.agencia) {
      // Tentar converter nome da agência para ID
      agenciaKey = agenciaNameToId.get(d.agencia) ?? d.agencia;
    } else {
      agenciaKey = "_sem_agencia";
    }
    
    const current = faturadoByAgenciaId.get(agenciaKey) ?? 0;
    faturadoByAgenciaId.set(agenciaKey, current + (d.valor ?? 0));
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
