"use server";

import { validateCentrosCustoUseCase } from "@/lib/use-cases/validate-centros-custo.use-case";
import { saveDemandaCentrosCustoUseCase } from "@/lib/use-cases/save-demanda-centros-custo.use-case";
import { getDemandaCentroCustoRepository, getDemandaRepository } from "@/lib/repositories";
import type { DemandaCentroCusto, DemandaCentroCustoInput } from "@/types/globals";

export async function getCentrosCustoAction(demandaId: string): Promise<DemandaCentroCusto[]> {
  const repository = getDemandaCentroCustoRepository();
  return repository.findByDemandaId(demandaId);
}

export async function saveCentrosCustoAction(
  demandaId: string,
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">>
): Promise<{ error?: string }> {
  try {
    // Buscar o valor total da demanda para validação
    const demandaRepository = getDemandaRepository();
    const demanda = await demandaRepository.findById(demandaId);
    
    if (!demanda) {
      return { error: "Demanda não encontrada." };
    }

    // Validar centros de custo usando use case (regra de negócio)
    if (centrosCusto.length > 0) {
      const validation = validateCentrosCustoUseCase({
        centrosCusto,
        valorTotalDemanda: demanda.valor,
      });

      if (!validation.isValid) {
        return { error: validation.error };
      }
    }

    // Salvar centros de custo usando use case
    const repository = getDemandaCentroCustoRepository();
    await saveDemandaCentrosCustoUseCase(demandaId, centrosCusto, {
      demandaCentroCustoRepository: repository,
    });
    
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar centros de custo.",
    };
  }
}
