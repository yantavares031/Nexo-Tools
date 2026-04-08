import type { Demanda } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";
import { getDemandasParaComprovacaoUseCase } from "@/lib/use-cases/get-demandas-para-comprovacao.use-case";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  ordemCompraRepository: IOrdemCompraRepository;
};

/**
 * Demandas elegíveis para novo pedido de OC (mesmo critério de comprovação),
 * excluindo as que já possuem pelo menos uma OC assinada.
 */
export async function getDemandasParaNovaOrdemCompraUseCase(
  filters: {
    mes?: string;
    search?: string;
    agenciaId?: string;
    agenciaNomeLegacy?: string;
  },
  deps: Dependencies
): Promise<Demanda[]> {
  const [base, demandaIdsComOcAssinada] = await Promise.all([
    getDemandasParaComprovacaoUseCase(filters, { demandaRepository: deps.demandaRepository }),
    deps.ordemCompraRepository.findDemandaIdsComOrdemCompraAssinada(),
  ]);
  const bloqueadas = new Set(demandaIdsComOcAssinada);
  return base.filter((d) => !bloqueadas.has(d.id));
}
