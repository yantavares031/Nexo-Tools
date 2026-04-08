import type { Demanda, DemandaInput } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { capitalizeFirst } from "@/lib/capitalize-first";
import { applyAgenciaIdToDemandaInputUseCase } from "./apply-agencia-id-to-demanda-input.use-case";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: atualizar uma demanda. */
export async function updateDemandaUseCase(
  id: string,
  input: DemandaInput,
  deps: Dependencies
): Promise<Demanda> {
  const comAgenciaId = await applyAgenciaIdToDemandaInputUseCase(input, {
    agenciaRepository: deps.agenciaRepository,
  });
  const normalizado: DemandaInput = {
    ...comAgenciaId,
    demanda: capitalizeFirst(comAgenciaId.demanda),
    solicitante: capitalizeFirst(comAgenciaId.solicitante),
  };
  return deps.demandaRepository.update(id, normalizado);
}
