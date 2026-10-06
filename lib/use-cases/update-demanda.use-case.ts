import type { Demanda, DemandaInput } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { capitalizeFirst } from "@/lib/capitalize-first";
import { applyAgenciaIdToDemandaInputUseCase } from "./apply-agencia-id-to-demanda-input.use-case";
import {
  diffDemandaFields,
  recordDemandaHistoricoUseCase,
  type HistoricoDeps,
} from "./record-demanda-historico.use-case";
import { logUseCaseInfo } from "@/lib/server-action-log";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
  historico?: HistoricoDeps;
};

/** Caso de uso: atualizar uma demanda. */
export async function updateDemandaUseCase(
  id: string,
  input: DemandaInput,
  deps: Dependencies
): Promise<Demanda> {
  const comAgenciaId = await applyAgenciaIdToDemandaInputUseCase(input, {
    agenciaRepository: deps.agenciaRepository,
  });
  const normalizado: DemandaInput = {
    ...comAgenciaId,
    demanda: capitalizeFirst(comAgenciaId.demanda),
    solicitante: capitalizeFirst(comAgenciaId.solicitante),
  };
  const anterior = deps.historico ? await deps.demandaRepository.findById(id) : null;
  const atualizada = await deps.demandaRepository.update(id, normalizado);

  if (anterior) {
    const alteracoes = diffDemandaFields(anterior, normalizado);
    if (alteracoes.length > 0) {
      const onlyStatus = alteracoes.length === 1 && alteracoes[0].campo === "Status";
      await recordDemandaHistoricoUseCase(
        {
          demandaId: id,
          tipo: "alterada",
          descricao: onlyStatus ? "Status alterado" : "Demanda atualizada",
          alteracoes,
        },
        deps.historico
      );
    }
  }

  await logUseCaseInfo("updateDemandaUseCase", "Demanda atualizada", {
    demandaId: id,
  });
  return atualizada;
}
