import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import { logUseCaseInfo } from "@/lib/server-action-log";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: remover uma demanda. */
export async function removeDemandaUseCase(
  id: string,
  deps: Dependencies
): Promise<void> {
  const demanda = await deps.demandaRepository.findById(id);
  if (!demanda) throw new Error("Demanda não encontrada");
  await deps.demandaRepository.remove(id);
  await logUseCaseInfo("removeDemandaUseCase", "Demanda removida", { demandaId: id });
}
