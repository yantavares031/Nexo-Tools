import {
  demandaMatchesAgenciaScope,
  type AgencyDemandaScope,
} from "@/lib/agency-demanda-scope";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";

type Dependencies = {
  ordemCompraRepository: IOrdemCompraRepository;
  demandaRepository: IDemandaRepository;
};

export type RemoveOrdemCompraEmAbertoActor = "admin" | "agency";

export async function removeOrdemCompraEmAbertoUseCase(
  id: string,
  deps: Dependencies,
  ctx: { actor: RemoveOrdemCompraEmAbertoActor; agencyScope?: AgencyDemandaScope }
): Promise<void> {
  const oc = await deps.ordemCompraRepository.findById(id);
  if (!oc) {
    throw new Error("Ordem de compra não encontrada.");
  }
  if (ctx.actor === "agency") {
    if (oc.status !== "em_aberto") {
      throw new Error("Pedidos já assinados não podem ser removidos.");
    }
    const scope = ctx.agencyScope;
    if (!scope) {
      throw new Error("Sem permissão para remover este pedido.");
    }
    const demanda = await deps.demandaRepository.findById(oc.demandaId);
    if (!demanda || !demandaMatchesAgenciaScope(demanda, scope)) {
      throw new Error("Sem permissão para remover este pedido.");
    }
  }
  await deps.ordemCompraRepository.remove(id);
}
