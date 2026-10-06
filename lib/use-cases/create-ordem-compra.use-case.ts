import type { OrdemCompra, OrdemCompraCreateInput } from "@/types/globals";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";
import {
  recordDemandaHistoricoUseCase,
  type HistoricoDeps,
} from "./record-demanda-historico.use-case";

type Dependencies = { ordemCompraRepository: IOrdemCompraRepository; historico?: HistoricoDeps };

export async function createOrdemCompraUseCase(
  input: OrdemCompraCreateInput,
  deps: Dependencies
): Promise<OrdemCompra> {
  const ordemCompra = await deps.ordemCompraRepository.create(input);
  await recordDemandaHistoricoUseCase(
    {
      demandaId: ordemCompra.demandaId,
      tipo: "ordem_compra_enviada",
      descricao: `Ordem de compra "${ordemCompra.nomeArquivo}" enviada para assinatura`,
    },
    deps.historico
  );
  return ordemCompra;
}
