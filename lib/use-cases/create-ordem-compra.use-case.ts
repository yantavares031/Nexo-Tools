import type { OrdemCompra, OrdemCompraCreateInput } from "@/types/globals";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";

type Dependencies = { ordemCompraRepository: IOrdemCompraRepository };

export async function createOrdemCompraUseCase(
  input: OrdemCompraCreateInput,
  deps: Dependencies
): Promise<OrdemCompra> {
  return deps.ordemCompraRepository.create(input);
}
