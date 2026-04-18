"use server";

import { revalidatePath } from "next/cache";
import {
  getDemandaComprovacaoRepository,
  getDemandaRepository,
  getWebhookConfigRepository,
  getWebhookSender,
} from "@/lib/repositories";
import type { Comprovacao } from "@/types/globals";
import type { Demanda } from "@/types/globals";
import { addDemandaComprovacaoUseCase } from "@/lib/use-cases/add-demanda-comprovacao.use-case";
import { removeComprovacaoFromDemandaUseCase } from "@/lib/use-cases/remove-comprovacao-from-demanda.use-case";
import { getSession } from "@/lib/auth";
import {
  getAgencyDemandaScope,
  demandaMatchesAgenciaScope,
} from "@/lib/agency-demanda-scope";
import path from "path";
import { randomUUID } from "crypto";
import {
  buildComprovacaoObjectKey,
  putAppObjectToR2,
} from "@/lib/r2-upload";
import { readStoredUploadFile } from "@/lib/stored-upload";
import { z } from "zod";
import { entityIdSchema, paginationLimitSchema, paginationPageSchema } from "@/lib/validation/schemas/common";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "comprovacoes");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".xml", ".txt", ".docx", ".doc", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"];

const comprovacaoDemandaIdsSchema = z
  .array(entityIdSchema)
  .min(1, "Selecione pelo menos uma demanda.")
  .max(100, "Número máximo de demandas por envio excedido.");

function contentTypeForComprovacaoExt(ext: string): string {
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

export async function createComprovacaoAction(
  formData: FormData
): Promise<{ error?: string; comprovacoes?: Comprovacao[] }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }

  const demandaIdsRaw = formData
    .getAll("demandaId")
    .map((v) => (typeof v === "string" ? v : "").trim())
    .filter(Boolean);
  const idsParsed = comprovacaoDemandaIdsSchema.safeParse(demandaIdsRaw);
  if (!idsParsed.success) {
    return { error: zodErrorToActionMessage(idsParsed.error) } as const;
  }
  const demandaIds = idsParsed.data;

  const filesRaw = formData.getAll("files") as File[];
  const singleFile = formData.get("file") as File | null;
  const files: File[] = filesRaw.length > 0 ? filesRaw : singleFile ? [singleFile] : [];

  if (files.length === 0) {
    return { error: "Nenhum arquivo foi enviado." } as const;
  }

  const descricao = (formData.get("descricao") as string)?.trim() || undefined;

  for (const file of files) {
    if (file.size === 0) continue;
    if (!isValidFileType(file.name)) {
      return {
        error: `Tipo de arquivo não permitido (${file.name}). Tipos permitidos: ${ALLOWED_EXTENSIONS.join(", ")}`,
      } as const;
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        error: `Arquivo muito grande (${file.name}). Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB por arquivo`,
      } as const;
    }
  }

  const validFiles = files.filter((f) => f.size > 0);
  if (validFiles.length === 0) {
    return { error: "Nenhum arquivo válido foi enviado." } as const;
  }

  try {
    const comprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();

    if (session.role === "agency") {
      const scope = await getAgencyDemandaScope(session);
      if (!scope) {
        return { error: "Usuário do tipo Agência sem agência vinculada." } as const;
      }
      for (const demandaId of demandaIds) {
        const demanda = await demandaRepository.findById(demandaId);
        if (!demanda) {
          return { error: "Demanda não encontrada." } as const;
        }
        if (!demandaMatchesAgenciaScope(demanda, scope)) {
          return { error: "Você não tem permissão para vincular comprovação a esta demanda." } as const;
        }
      }
    }

    const webhookConfigRepository = getWebhookConfigRepository();
    const webhookSender = getWebhookSender();
    const comprovacoes: Comprovacao[] = [];

    for (const file of validFiles) {
      const fileId = randomUUID();
      const ext = getFileExtension(file.name);
      const objectKey = buildComprovacaoObjectKey(fileId, ext);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await putAppObjectToR2({
        key: objectKey,
        body: buffer,
        contentType: contentTypeForComprovacaoExt(ext),
      });

      const comprovacao = await addDemandaComprovacaoUseCase(
        {
          nomeArquivo: file.name,
          tipoArquivo: ext,
          tamanho: file.size,
          caminhoArquivo: objectKey,
          descricao,
          autor: session.name ?? "",
        },
        demandaIds,
        {
          demandaComprovacaoRepository: comprovacaoRepository,
          demandaRepository,
          webhookConfigRepository,
          webhookSender,
        }
      );
      comprovacoes.push(comprovacao);
    }

    revalidatePath("/");
    revalidatePath("/comprovacoes");
    revalidatePath("/comprovacoes/adicionar");
    return { comprovacoes };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Body exceeded")) {
      return {
        error: "O arquivo é muito grande. O tamanho máximo permitido é 10MB por arquivo.",
      } as const;
    }
    logServerActionError("createComprovacaoAction", err, { demandaCount: demandaIds.length });
    return {
      error: err instanceof Error ? err.message : "Erro ao fazer upload do arquivo.",
    } as const;
  }
}

export async function getComprovacoesAction(demandaId: string): Promise<Comprovacao[]> {
  const idCheck = entityIdSchema.safeParse(demandaId);
  if (!idCheck.success) return [];
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  return comprovacaoRepository.findByDemandaId(idCheck.data);
}

export async function getComprovacoesListAction(filters?: {
  agenciaId?: string;
}): Promise<import("@/lib/domain/demanda-comprovacao.repository").ComprovacaoListItem[]> {
  const session = await getSession();
  if (!session) return [];
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const agencyScope = await getAgencyDemandaScope(session);
  const agenciaId = agencyScope?.agenciaId ?? filters?.agenciaId;
  const agenciaNomeLegacy = agencyScope?.agenciaNomeLegacy;
  return comprovacaoRepository.findAll({ agenciaId, agenciaNomeLegacy });
}

export interface ComprovacaoDetalhesResult {
  comprovacao: Comprovacao;
  demandas: Demanda[];
}

export async function getComprovacaoDetalhesAction(
  id: string
): Promise<ComprovacaoDetalhesResult | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Não autenticado." };

  const idCheck = entityIdSchema.safeParse(id);
  if (!idCheck.success) {
    return { error: zodErrorToActionMessage(idCheck.error) };
  }

  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const demandaRepository = getDemandaRepository();

  const comprovacao = await comprovacaoRepository.findById(idCheck.data);
  if (!comprovacao) return { error: "Comprovação não encontrada." };

  const demandaIds = await comprovacaoRepository.findDemandaIdsByComprovacaoId(idCheck.data);
  const demandas: Demanda[] = [];
  for (const did of demandaIds) {
    const d = await demandaRepository.findById(did);
    if (d) demandas.push(d);
  }

  return { comprovacao, demandas };
}

export async function getComprovacoesPaginatedAction(
  page: number,
  limit: number,
  filters?: { q?: string }
): Promise<import("@/lib/domain/demanda-comprovacao.repository").ComprovacaoPaginatedResult> {
  const session = await getSession();
  const pageParsed = paginationPageSchema.safeParse(page);
  const limitParsed = paginationLimitSchema.safeParse(limit);
  const safePage = pageParsed.success ? pageParsed.data : 1;
  const safeLimit = limitParsed.success ? limitParsed.data : 20;
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const agencyScope = await getAgencyDemandaScope(session);
  const agenciaId = agencyScope?.agenciaId;
  const agenciaNomeLegacy = agencyScope?.agenciaNomeLegacy;
  const q = filters?.q?.trim() || undefined;
  return comprovacaoRepository.findPaginated(
    { agenciaId, agenciaNomeLegacy, q },
    { page: safePage, limit: safeLimit }
  );
}

export async function downloadComprovacaoAction(id: string): Promise<{
  error?: string;
  file?: { buffer: Buffer; nomeArquivo: string; tipoArquivo: string };
}> {
  const idCheck = entityIdSchema.safeParse(id);
  if (!idCheck.success) {
    return { error: zodErrorToActionMessage(idCheck.error) } as const;
  }
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const comprovacao = await comprovacaoRepository.findById(idCheck.data);

  if (!comprovacao) {
    return { error: "Comprovação não encontrada." } as const;
  }

  try {
    const buffer = await readStoredUploadFile(comprovacao.caminhoArquivo, UPLOADS_DIR);
    return {
      file: {
        buffer,
        nomeArquivo: comprovacao.nomeArquivo,
        tipoArquivo: comprovacao.tipoArquivo,
      },
    };
  } catch (err) {
    logServerActionError("downloadComprovacaoAction", err, { id: idCheck.data });
    return { error: "Arquivo não encontrado." } as const;
  }
}

export async function removeComprovacaoAction(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem remover comprovações." } as const;
  }

  const idCheck = entityIdSchema.safeParse(id);
  if (!idCheck.success) {
    return { error: zodErrorToActionMessage(idCheck.error) } as const;
  }

  try {
    const comprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();
    const demandaIds = await comprovacaoRepository.findDemandaIdsByComprovacaoId(idCheck.data);

    const demandasParaReverter: string[] = [];
    for (const demandaId of demandaIds) {
      const comprovacoesDaDemanda = await comprovacaoRepository.findByDemandaId(demandaId);
      if (comprovacoesDaDemanda.length === 1 && comprovacoesDaDemanda[0].id === idCheck.data) {
        demandasParaReverter.push(demandaId);
      }
    }

    await comprovacaoRepository.remove(idCheck.data);

    for (const demandaId of demandasParaReverter) {
      const demanda = await demandaRepository.findById(demandaId);
      if (demanda) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...input } = demanda;
        await demandaRepository.update(demandaId, { ...input, status: "comprometido" });
      }
    }
    revalidatePath("/");
    revalidatePath("/comprovacoes");
    revalidatePath("/comprovacoes/adicionar");
    return {};
  } catch (err) {
    logServerActionError("removeComprovacaoAction", err, { id: idCheck.data });
    return {
      error: err instanceof Error ? err.message : "Erro ao remover comprovação.",
    } as const;
  }
}

export async function removeComprovacaoFromDemandaAction(
  demandaId: string,
  comprovacaoId: string
): Promise<{ error?: string; removedComprovacao?: boolean }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem remover comprovações." } as const;
  }

  const demandaIdCheck = entityIdSchema.safeParse(demandaId);
  if (!demandaIdCheck.success) {
    return { error: zodErrorToActionMessage(demandaIdCheck.error) } as const;
  }
  const comprovacaoIdCheck = entityIdSchema.safeParse(comprovacaoId);
  if (!comprovacaoIdCheck.success) {
    return { error: zodErrorToActionMessage(comprovacaoIdCheck.error) } as const;
  }

  try {
    const demandaComprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();

    const result = await removeComprovacaoFromDemandaUseCase(
      { demandaId: demandaIdCheck.data, comprovacaoId: comprovacaoIdCheck.data },
      { demandaComprovacaoRepository, demandaRepository }
    );

    revalidatePath("/");
    revalidatePath("/comprovacoes");
    return { removedComprovacao: result.removedComprovacao };
  } catch (err) {
    logServerActionError("removeComprovacaoFromDemandaAction", err, {
      demandaId: demandaIdCheck.data,
      comprovacaoId: comprovacaoIdCheck.data,
    });
    return {
      error: err instanceof Error ? err.message : "Erro ao remover comprovação.",
    } as const;
  }
}
