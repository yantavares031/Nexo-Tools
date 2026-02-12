import type { Agencia } from "@/types/globals";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";

type Dependencies = {
  agenciaRepository: IAgenciaRepository;
};

/** Caso de uso: listar todas as agências. */
export async function listAgenciasUseCase(
  deps: Dependencies
): Promise<Agencia[]> {
  return deps.agenciaRepository.findAll();
}
