import type { DemandaInput } from "@/types/globals";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = { agenciaRepository: IAgenciaRepository };

/**
 * Preenche agenciaId a partir do nome fantasia selecionado no formulário.
 * Demandas sem agenciaId quebram o filtro de usuários agency.
 */
export async function applyAgenciaIdToDemandaInputUseCase(
  input: DemandaInput,
  deps: Dependencies
): Promise<DemandaInput> {
  const nome = input.agencia?.trim();
  if (!nome) {
    return { ...input, agenciaId: undefined };
  }
  const agencias = await deps.agenciaRepository.findAll();
  const match = agencias.find((a) => a.nomeFantasia === nome);
  return { ...input, agenciaId: match?.id };
}
