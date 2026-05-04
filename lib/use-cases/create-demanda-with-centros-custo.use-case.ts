import type { Demanda, DemandaInput } from "@/types/globals";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IDemandaCentroCustoRepository } from "@/lib/domain/demanda-centro-custo.repository";
import type { IWebhookConfigRepository } from "@/lib/domain/webhook-config.repository";
import type { IWebhookSender } from "@/lib/domain/webhook-sender";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import { createDemandaUseCase } from "./create-demanda.use-case";
import { applyAgenciaIdToDemandaInputUseCase } from "./apply-agencia-id-to-demanda-input.use-case";
import { saveDemandaCentrosCustoUseCase } from "./save-demanda-centros-custo.use-case";
import { dispatchWebhookForEventUseCase } from "./dispatch-webhook-for-event.use-case";
import type { DemandaCentroCustoInput } from "@/types/globals";
import { logUseCaseInfo } from "@/lib/server-action-log";

type Dependencies = {
  demandaRepository: IDemandaRepository;
  agenciaRepository: IAgenciaRepository;
  demandaCentroCustoRepository: IDemandaCentroCustoRepository;
  /** Opcional: quando informado, dispara webhook "demanda.criada" após criar a demanda. */
  webhookConfigRepository?: IWebhookConfigRepository;
  webhookSender?: IWebhookSender;
};

/**
 * Caso de uso: criar uma demanda com seus centros de custo.
 * Regra de negócio: Agências não podem criar demandas.
 */
export async function createDemandaWithCentrosCustoUseCase(
  input: DemandaInput,
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">> | null,
  userRole: string | null | undefined,
  deps: Dependencies
): Promise<Demanda> {
  // Regra de negócio: Agências não podem criar demandas
  if (userRole === "agency") {
    throw new Error("Agências não podem cadastrar demandas.");
  }

  const inputComAgenciaId = await applyAgenciaIdToDemandaInputUseCase(input, {
    agenciaRepository: deps.agenciaRepository,
  });

  // Criar a demanda
  const demandaCriada = await createDemandaUseCase(inputComAgenciaId, {
    demandaRepository: deps.demandaRepository,
  });

  // Salvar centros de custo se houver
  if (centrosCusto && centrosCusto.length > 0) {
    await saveDemandaCentrosCustoUseCase(demandaCriada.id, centrosCusto, {
      demandaCentroCustoRepository: deps.demandaCentroCustoRepository,
    });
  }

  // Regra de negócio: se webhook estiver ativado para "demanda.criada", disparar
  if (deps.webhookConfigRepository && deps.webhookSender) {
    await dispatchWebhookForEventUseCase(
      "demanda.criada",
      { demanda: demandaCriada },
      {
        webhookConfigRepository: deps.webhookConfigRepository,
        webhookSender: deps.webhookSender,
      }
    );
  }

  await logUseCaseInfo(
    "createDemandaWithCentrosCustoUseCase",
    "Demanda criada",
    {
      demandaId: demandaCriada.id,
      centrosCustoCount: centrosCusto?.length ?? 0,
      actorRole: userRole ?? undefined,
    }
  );

  return demandaCriada;
}
