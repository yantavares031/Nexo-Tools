import type { Demanda, DemandaInput } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import { capitalizeFirst } from "@/lib/capitalize-first";

type Dependencies = {
  demandaRepository: IDemandaRepository;
};

/** Caso de uso: criar uma nova demanda. */
export async function createDemandaUseCase(
  input: DemandaInput,
  deps: Dependencies
): Promise<Demanda> {
  const normalizado: DemandaInput = {
    ...input,
    demanda: capitalizeFirst(input.demanda),
    solicitante: capitalizeFirst(input.solicitante),
  };
  return deps.demandaRepository.create(normalizado);
}
