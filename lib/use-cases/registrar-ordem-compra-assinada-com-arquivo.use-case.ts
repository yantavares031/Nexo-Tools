import type {
  IOrdemCompraRepository,
  OrdemCompraRegistrarAssinaturaInput,
} from "@/lib/domain/ordem-compra.repository";
import {
  recordDemandaHistoricoUseCase,
  type HistoricoDeps,
} from "./record-demanda-historico.use-case";

type Dependencies = { ordemCompraRepository: IOrdemCompraRepository; historico?: HistoricoDeps };

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
  await recordDemandaHistoricoUseCase(
    {
      demandaId: oc.demandaId,
      tipo: "ordem_compra_assinada",
      descricao: `Ordem de compra "${oc.nomeArquivo}" assinada`,
      alteracoes: [{ campo: "Ordem de compra", de: "Em aberto", para: "Assinada" }],
    },
    deps.historico
  );
}
