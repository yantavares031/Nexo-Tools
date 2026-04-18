"use server";

import { validateCentrosCustoUseCase } from "@/lib/use-cases/validate-centros-custo.use-case";
import { saveDemandaCentrosCustoUseCase } from "@/lib/use-cases/save-demanda-centros-custo.use-case";
import { getDemandaCentroCustoRepository, getDemandaRepository } from "@/lib/repositories";
import type { DemandaCentroCusto, DemandaCentroCustoInput } from "@/types/globals";
import { saveCentrosCustoPayloadSchema } from "@/lib/validation/schemas/demanda-centro-custo-payload";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseEntityId } from "@/lib/validation/schemas/common";

export async function getCentrosCustoAction(demandaId: string): Promise<DemandaCentroCusto[]> {
  const idCheck = parseEntityId(demandaId);
  if (!idCheck.ok) {
    return [];
  }
  const repository = getDemandaCentroCustoRepository();
  return repository.findByDemandaId(idCheck.id);
}

export async function saveCentrosCustoAction(
  demandaId: string,
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">>
): Promise<{ error?: string }> {
  const parsed = saveCentrosCustoPayloadSchema.safeParse({ demandaId, centrosCusto });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { demandaId: did, centrosCusto: centros } = parsed.data;

  try {
    const demandaRepository = getDemandaRepository();
    const demanda = await demandaRepository.findById(did);

    if (!demanda) {
      return { error: "Demanda não encontrada." };
    }

    if (centros.length > 0) {
      const validation = validateCentrosCustoUseCase({
        centrosCusto: centros,
        valorTotalDemanda: demanda.valor,
      });

      if (!validation.isValid) {
        return { error: validation.error };
      }
    }

    const repository = getDemandaCentroCustoRepository();
    await saveDemandaCentrosCustoUseCase(did, centros, {
      demandaCentroCustoRepository: repository,
    });

    return {};
  } catch (err) {
    logServerActionError("saveCentrosCustoAction", err, { demandaId: did });
    return {
      error: err instanceof Error ? err.message : "Erro ao salvar centros de custo.",
    };
  }
}
