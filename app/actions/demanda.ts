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
} from "@/lib/repositories";
import { parseBrazilianCurrency } from "@/lib/currency";
import { getSession } from "@/lib/auth";
import type { DemandaInput } from "@/types/globals";

export async function createDemandaAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await getSession();

  const demanda = (formData.get("demanda") as string)?.trim() ?? "";
  const solicitante = (formData.get("solicitante") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";
  const obs = (formData.get("obs") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) ?? "comprometido";
  const valor = parseBrazilianCurrency((formData.get("valor") as string) ?? "");
  const centroDeCusto = (formData.get("centroDeCusto") as string)?.trim() ?? "";
  const ocPi = (formData.get("ocPi") as string)?.trim() ?? "";
  const mes = (formData.get("mes") as string)?.trim() ?? "";
  const agencia = (formData.get("agencia") as string)?.trim() || undefined;

  if (!demanda || !solicitante || !unResponsavel) {
    return { error: "Demanda, solicitante e unidade responsável são obrigatórios." } as const;
  }

  const input: DemandaInput = {
    demanda,
    solicitante,
    unResponsavel,
    obs,
    status: status as "faturado" | "comprometido",
    valor,
    centroDeCusto,
    ocPi,
    mes,
    agencia,
  };

  // Validar centros de custo antes de criar a demanda (regra de negócio no use case)
  const centrosCustoJson = formData.get("centrosCusto") as string | null;
  let centrosCusto: Array<{ centroDeCusto: string; valor: number; ordem: number }> | null = null;
  
  if (centrosCustoJson) {
    try {
      centrosCusto = JSON.parse(centrosCustoJson) as Array<{ centroDeCusto: string; valor: number; ordem: number }>;
      if (centrosCusto.length > 0) {
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
    } catch (err) {
      console.error("Erro ao validar centros de custo:", err);
      return { error: "Erro ao processar os centros de custo." } as const;
    }
  }

  const demandaRepository = getDemandaRepository();
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
        demandaCentroCustoRepository,
        webhookConfigRepository,
        webhookSender,
      }
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao criar demanda.",
    } as const;
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/?created=1");
}

export async function updateDemandaAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const demanda = (formData.get("demanda") as string)?.trim() ?? "";
  const solicitante = (formData.get("solicitante") as string)?.trim() ?? "";
  const unResponsavel = (formData.get("unResponsavel") as string)?.trim() ?? "";
  const obs = (formData.get("obs") as string)?.trim() ?? "";
  const status = (formData.get("status") as string) ?? "comprometido";
  const valor = parseBrazilianCurrency((formData.get("valor") as string) ?? "");
  const centroDeCusto = (formData.get("centroDeCusto") as string)?.trim() ?? "";
  const ocPi = (formData.get("ocPi") as string)?.trim() ?? "";
  const mes = (formData.get("mes") as string)?.trim() ?? "";
  const agencia = (formData.get("agencia") as string)?.trim() || undefined;

  if (!demanda || !solicitante || !unResponsavel) {
    return { error: "Demanda, solicitante e unidade responsável são obrigatórios." } as const;
  }

  const input: DemandaInput = {
    demanda,
    solicitante,
    unResponsavel,
    obs,
    status: status as "faturado" | "comprometido",
    valor,
    centroDeCusto,
    ocPi,
    mes,
    agencia,
  };

  const demandaRepository = getDemandaRepository();
  try {
    await updateDemandaUseCase(id, input, { demandaRepository });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar demanda.",
    } as const;
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/?updated=1");
}

export async function removeDemandaAction(id: string) {
  const demandaRepository = getDemandaRepository();
  await removeDemandaUseCase(id, { demandaRepository });
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/?removed=1");
}
