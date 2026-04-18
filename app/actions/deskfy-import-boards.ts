"use server";

import { revalidatePath } from "next/cache";
import { getDeskfyImportBoardRepository } from "@/lib/repositories";
import { addDeskfyImportBoardUseCase } from "@/lib/use-cases/add-deskfy-import-board.use-case";
import { removeDeskfyImportBoardUseCase } from "@/lib/use-cases/remove-deskfy-import-board.use-case";
import { getSession } from "@/lib/auth";
import { deskfyBoardNomeSchema } from "@/lib/validation/schemas/deskfy-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import { parseEntityId } from "@/lib/validation/schemas/common";

export async function listDeskfyImportBoardsAction(): Promise<
  { boards: { id: string; nome: string }[] } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  try {
    const repo = getDeskfyImportBoardRepository();
    const boards = await repo.findAll();
    return { boards };
  } catch (err) {
    logServerActionError("listDeskfyImportBoardsAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao listar boards.",
    };
  }
}

export async function addDeskfyImportBoardAction(nome: string): Promise<
  { board: { id: string; nome: string } } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  const parsed = deskfyBoardNomeSchema.safeParse(nome);
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    const repo = getDeskfyImportBoardRepository();
    const board = await addDeskfyImportBoardUseCase(parsed.data, {
      deskfyImportBoardRepository: repo,
    });
    revalidatePath("/integracoes");
    revalidatePath("/demandas/importar");
    return { board };
  } catch (err) {
    logServerActionError("addDeskfyImportBoardAction", err, { nome: parsed.data });
    return {
      error: err instanceof Error ? err.message : "Erro ao adicionar board.",
    };
  }
}

export async function removeDeskfyImportBoardAction(id: string): Promise<
  { ok: true } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (session.role !== "admin") return { error: "Sem permissão." };

  const idCheck = parseEntityId(id);
  if (!idCheck.ok) {
    return { error: idCheck.error };
  }

  try {
    const repo = getDeskfyImportBoardRepository();
    await removeDeskfyImportBoardUseCase(idCheck.id, {
      deskfyImportBoardRepository: repo,
    });
    revalidatePath("/integracoes");
    revalidatePath("/demandas/importar");
    return { ok: true };
  } catch (err) {
    logServerActionError("removeDeskfyImportBoardAction", err, { id: idCheck.id });
    return {
      error: err instanceof Error ? err.message : "Erro ao remover board.",
    };
  }
}
