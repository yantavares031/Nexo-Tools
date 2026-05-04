"use server";

import { revalidatePath } from "next/cache";
import { addDemandaMensagemUseCase } from "@/lib/use-cases/add-demanda-mensagem.use-case";
import { getDemandaMensagemRepository } from "@/lib/repositories";
import { getSession } from "@/lib/auth";
import type { DemandaMensagem } from "@/types/globals";
import { addDemandaMensagemPayloadSchema } from "@/lib/validation/schemas/demanda-mensagem-payload";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseDemandaRecordId } from "@/lib/validation/schemas/common";

export async function addDemandaMensagemAction(
  demandaId: string,
  mensagem: string
): Promise<{ error?: string; mensagem?: DemandaMensagem }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }

  const parsed = addDemandaMensagemPayloadSchema.safeParse({ demandaId, mensagem });
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const mensagemRepository = getDemandaMensagemRepository();
  try {
    const novaMensagem = await addDemandaMensagemUseCase(
      {
        demandaId: parsed.data.demandaId,
        mensagem: parsed.data.mensagem,
        autor: session.name,
      },
      {
        demandaMensagemRepository: mensagemRepository,
      }
    );
    revalidatePath("/");
    return { mensagem: novaMensagem };
  } catch (err) {
    await logServerActionError("addDemandaMensagemAction", err, { demandaId: parsed.data.demandaId });
    return {
      error: err instanceof Error ? err.message : "Erro ao adicionar mensagem.",
    } as const;
  }
}

export async function getDemandaMensagensAction(
  demandaId: string
): Promise<DemandaMensagem[]> {
  const idCheck = parseDemandaRecordId(demandaId);
  if (!idCheck.ok) {
    return [];
  }
  const mensagemRepository = getDemandaMensagemRepository();
  return mensagemRepository.findByDemandaId(idCheck.id);
}
