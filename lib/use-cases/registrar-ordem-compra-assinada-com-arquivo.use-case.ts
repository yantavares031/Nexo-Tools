import type {
  IOrdemCompraRepository,
  OrdemCompraRegistrarAssinaturaInput,
} from "@/lib/domain/ordem-compra.repository";

type Dependencies = { ordemCompraRepository: IOrdemCompraRepository };

export async function registrarOrdemCompraAssinadaComArquivoUseCase(
  id: string,
  input: OrdemCompraRegistrarAssinaturaInput,
  deps: Dependencies
): Promise<void> {
  const oc = await deps.ordemCompraRepository.findById(id);
  if (!oc) {
    throw new Error("Ordem de compra não encontrada.");
  }
  if (oc.status !== "em_aberto") {
    throw new Error("Apenas pedidos em aberto podem receber o PDF assinado.");
  }
  await deps.ordemCompraRepository.registrarAssinaturaComArquivo(id, input);
}
