import type { CentroCusto, CentroCustoInput } from "@/types/globals";
import type { ICentroCustoRepository } from "@/lib/domain/centro-custo.repository";

type Dependencies = {
  centroCustoRepository: ICentroCustoRepository;
};

/**
 * Caso de uso: atualizar um centro de custo.
 * Regras de negócio:
 * - Nome deve ser único (exceto o próprio centro de custo)
 */
export function updateCentroCustoUseCase(
  id: string,
  input: Partial<CentroCustoInput>,
  deps: Dependencies
): CentroCusto | null {
  const existente = deps.centroCustoRepository.findById(id);
  if (!existente) {
    throw new Error("Centro de custo não encontrado");
  }

  // Se está atualizando o nome, verificar se não existe outro com o mesmo nome
  if (input.nome !== undefined) {
    const outroComNome = deps.centroCustoRepository.findByName(input.nome);
    if (outroComNome && outroComNome.id !== id) {
      throw new Error("Já existe um centro de custo com este nome");
    }
  }

  const atualizado = deps.centroCustoRepository.update(id, input);
  if (!atualizado) {
    throw new Error("Centro de custo não encontrado");
  }

  return atualizado;
}
