import type { CentroCusto, CentroCustoInput } from "@/types/globals";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";

type Dependencies = {
  centroCustoRepository: ICentroCustoRepository;
};

/**
 * Caso de uso: criar um novo centro de custo.
 * Regras de negócio:
 * - Nome deve ser único
 */
export async function createCentroCustoUseCase(
  input: CentroCustoInput,
  deps: Dependencies
): Promise<CentroCusto> {
  // Verificar se já existe um centro de custo com o mesmo nome
  const existente = await deps.centroCustoRepository.findByName(input.nome);
  if (existente) {
    throw new Error("Já existe um centro de custo com este nome");
  }

  return deps.centroCustoRepository.create(input);
}
