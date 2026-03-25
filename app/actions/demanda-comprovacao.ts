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
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "comprovacoes");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".pdf", ".xml", ".txt", ".docx", ".doc", ".xlsx", ".xls", ".jpg", ".jpeg", ".png"];

// Garantir que o diretório existe
async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório de uploads:", error);
  }
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

  const demandaIds = (formData.getAll("demandaId") as string[]).filter(Boolean);
  if (demandaIds.length === 0) {
    return { error: "Selecione pelo menos uma demanda." } as const;
  }

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
    await ensureUploadsDir();

    const comprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();

    if (session.role === "agency") {
      if (!session.agenciaId) {
        return { error: "Usuário do tipo Agência sem agência vinculada." } as const;
      }
      for (const demandaId of demandaIds) {
        const demanda = await demandaRepository.findById(demandaId);
        if (!demanda) {
          return { error: "Demanda não encontrada." } as const;
        }
        if (demanda.agenciaId !== session.agenciaId) {
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
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      const comprovacao = await addDemandaComprovacaoUseCase(
        {
          nomeArquivo: file.name,
          tipoArquivo: ext,
          tamanho: file.size,
          caminhoArquivo: fileName,
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
    return {
      error: err instanceof Error ? err.message : "Erro ao fazer upload do arquivo.",
    } as const;
  }
}

export async function getComprovacoesAction(demandaId: string): Promise<Comprovacao[]> {
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  return comprovacaoRepository.findByDemandaId(demandaId);
}

export async function getComprovacoesListAction(filters?: {
  agenciaId?: string;
}): Promise<import("@/lib/domain/demanda-comprovacao.repository").ComprovacaoListItem[]> {
  const session = await getSession();
  if (!session) return [];
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const agenciaId =
    session.role === "agency" && session.agenciaId ? session.agenciaId : filters?.agenciaId;
  return comprovacaoRepository.findAll({ agenciaId });
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

  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const demandaRepository = getDemandaRepository();

  const comprovacao = await comprovacaoRepository.findById(id);
  if (!comprovacao) return { error: "Comprovação não encontrada." };

  const demandaIds = await comprovacaoRepository.findDemandaIdsByComprovacaoId(id);
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
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const agenciaId =
    session?.role === "agency" && session?.agenciaId ? session.agenciaId : undefined;
  const q = filters?.q?.trim() || undefined;
  return comprovacaoRepository.findPaginated({ agenciaId, q }, { page, limit });
}

export async function downloadComprovacaoAction(id: string): Promise<{
  error?: string;
  file?: { path: string; nomeArquivo: string; tipoArquivo: string };
}> {
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  const comprovacao = await comprovacaoRepository.findById(id);

  if (!comprovacao) {
    return { error: "Comprovação não encontrada." } as const;
  }

  const filePath = path.join(UPLOADS_DIR, comprovacao.caminhoArquivo);

  return {
    file: {
      path: filePath,
      nomeArquivo: comprovacao.nomeArquivo,
      tipoArquivo: comprovacao.tipoArquivo,
    },
  };
}

export async function removeComprovacaoAction(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem remover comprovações." } as const;
  }

  try {
    const comprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();
    const demandaIds = await comprovacaoRepository.findDemandaIdsByComprovacaoId(id);

    const demandasParaReverter: string[] = [];
    for (const demandaId of demandaIds) {
      const comprovacoesDaDemanda = await comprovacaoRepository.findByDemandaId(demandaId);
      if (comprovacoesDaDemanda.length === 1 && comprovacoesDaDemanda[0].id === id) {
        demandasParaReverter.push(demandaId);
      }
    }

    await comprovacaoRepository.remove(id);

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

  try {
    const demandaComprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();

    const result = await removeComprovacaoFromDemandaUseCase(
      { demandaId, comprovacaoId },
      { demandaComprovacaoRepository, demandaRepository }
    );

    revalidatePath("/");
    revalidatePath("/comprovacoes");
    return { removedComprovacao: result.removedComprovacao };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao remover comprovação.",
    } as const;
  }
}
