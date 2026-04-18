"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createDemandaWithCentrosCustoUseCase } from "@/lib/use-cases/create-demanda-with-centros-custo.use-case";
import { updateDemandaUseCase } from "@/lib/use-cases/update-demanda.use-case";
import { removeDemandaUseCase } from "@/lib/use-cases/remove-demanda.use-case";
import { validateCentrosCustoUseCase } from "@/lib/use-cases/validate-centros-custo.use-case";
import {
  getDemandaRepository,
  getDemandaCentroCustoRepository,
  getWebhookConfigRepository,
  getWebhookSender,
  getAgenciaRepository,
} from "@/lib/repositories";
import { parseBrazilianCurrency } from "@/lib/currency";
import { getSession } from "@/lib/auth";
import type { DemandaInput } from "@/types/globals";
import {
  demandaFormFieldsSchema,
  formDataToDemandaRaw,
  parseCentrosCustoJson,
} from "@/lib/validation/schemas/demanda-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseEntityId } from "@/lib/validation/schemas/common";

export async function createDemandaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await getSession();

  const fields = demandaFormFieldsSchema.safeParse(formDataToDemandaRaw(formData));
  if (!fields.success) {
    return { error: zodErrorToActionMessage(fields.error) } as const;
  }
  const f = fields.data;

  const valor = parseBrazilianCurrency(f.valor);

  const input: DemandaInput = {
    demanda: f.demanda,
    solicitante: f.solicitante,
    unResponsavel: f.unResponsavel,
    obs: f.obs,
    status: f.status,
    valor,
    centroDeCusto: f.centroDeCusto,
    ocPi: f.ocPi,
    mes: f.mes,
    agencia: f.agencia,
  };

  const centrosParsed = parseCentrosCustoJson(f.centrosCustoJson ?? null);
  if (!centrosParsed.ok) {
    return { error: centrosParsed.error } as const;
  }
  let centrosCusto = centrosParsed.data.length > 0 ? centrosParsed.data : null;

  if (centrosCusto && centrosCusto.length > 0) {
    const validation = validateCentrosCustoUseCase({
      centrosCusto: centrosCusto.map((cc) => ({
        centroDeCusto: cc.centroDeCusto,
        valor: cc.valor,
        ordem: cc.ordem,
      })),
      valorTotalDemanda: valor,
    });

    if (!validation.isValid) {
      return { error: validation.error } as const;
    }
  }

  const demandaRepository = getDemandaRepository();
  const agenciaRepository = getAgenciaRepository();
  const demandaCentroCustoRepository = getDemandaCentroCustoRepository();
  const webhookConfigRepository = getWebhookConfigRepository();
  const webhookSender = getWebhookSender();

  try {
    await createDemandaWithCentrosCustoUseCase(
      input,
      centrosCusto?.map((cc) => ({
        centroDeCusto: cc.centroDeCusto,
        valor: cc.valor,
        ordem: cc.ordem,
      })) || null,
      session?.role,
      {
        demandaRepository,
        agenciaRepository,
        demandaCentroCustoRepository,
        webhookConfigRepository,
        webhookSender,
      }
    );
  } catch (err) {
    logServerActionError("createDemandaAction", err, { demanda: input.demanda });
    return {
      error: err instanceof Error ? err.message : "Erro ao criar demanda.",
    } as const;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  const redirectTo = f.redirectTo.trim();
  if (redirectTo === "importar") {
    redirect("/demandas/importar?imported=1");
  }
  redirect("/?created=1");
}

export async function updateDemandaAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const idCheck = parseEntityId(id);
  if (!idCheck.ok) {
    return { error: idCheck.error } as const;
  }

  const fields = demandaFormFieldsSchema.safeParse(formDataToDemandaRaw(formData));
  if (!fields.success) {
    return { error: zodErrorToActionMessage(fields.error) } as const;
  }
  const f = fields.data;

  const valor = parseBrazilianCurrency(f.valor);

  const input: DemandaInput = {
    demanda: f.demanda,
    solicitante: f.solicitante,
    unResponsavel: f.unResponsavel,
    obs: f.obs,
    status: f.status,
    valor,
    centroDeCusto: f.centroDeCusto,
    ocPi: f.ocPi,
    mes: f.mes,
    agencia: f.agencia,
  };

  const demandaRepository = getDemandaRepository();
  const agenciaRepository = getAgenciaRepository();
  try {
    await updateDemandaUseCase(idCheck.id, input, { demandaRepository, agenciaRepository });
  } catch (err) {
    logServerActionError("updateDemandaAction", err, { id: idCheck.id });
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar demanda.",
    } as const;
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/?updated=1");
}

export async function removeDemandaAction(id: string) {
  const idCheck = parseEntityId(id);
  if (!idCheck.ok) {
    redirect("/?error=" + encodeURIComponent(idCheck.error));
  }

  const demandaRepository = getDemandaRepository();
  try {
    await removeDemandaUseCase(idCheck.id, { demandaRepository });
  } catch (err) {
    logServerActionError("removeDemandaAction", err, { id: idCheck.id });
    redirect("/?error=" + encodeURIComponent("Erro ao remover demanda."));
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/?removed=1");
}
