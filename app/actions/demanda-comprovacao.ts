"use server";

import { revalidatePath } from "next/cache";
import {
  getDemandaComprovacaoRepository,
  getDemandaRepository,
  getWebhookConfigRepository,
  getWebhookSender,
} from "@/lib/repositories";
import { addDemandaComprovacaoUseCase } from "@/lib/use-cases/add-demanda-comprovacao.use-case";
import { getSession } from "@/lib/auth";
import type { DemandaComprovacao } from "@/types/globals";
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

export async function uploadComprovacaoAction(
  demandaId: string,
  formData: FormData
): Promise<{ error?: string; comprovacao?: DemandaComprovacao }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: "Nenhum arquivo foi enviado." } as const;
  }

  const descricao = (formData.get("descricao") as string)?.trim() || undefined;

  // Validar tipo de arquivo
  if (!isValidFileType(file.name)) {
    return {
      error: `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_EXTENSIONS.join(", ")}`,
    } as const;
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` } as const;
  }

  try {
    await ensureUploadsDir();

    // Gerar nome único para o arquivo
    const fileId = randomUUID();
    const ext = getFileExtension(file.name);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Criar registro no banco e disparar webhook "demanda.comprovada" se habilitado (use case)
    const comprovacaoRepository = getDemandaComprovacaoRepository();
    const demandaRepository = getDemandaRepository();
    const webhookConfigRepository = getWebhookConfigRepository();
    const webhookSender = getWebhookSender();
    const comprovacao = await addDemandaComprovacaoUseCase(
      {
        demandaId,
        nomeArquivo: file.name,
        tipoArquivo: ext,
        tamanho: file.size,
        caminhoArquivo: fileName,
        descricao,
        autor: session.name ?? "",
      },
      {
        demandaComprovacaoRepository: comprovacaoRepository,
        demandaRepository,
        webhookConfigRepository,
        webhookSender,
      }
    );

    revalidatePath("/");
    return { comprovacao };
  } catch (err) {
    // Tratar erro de limite de tamanho do body
    if (err instanceof Error && err.message.includes("Body exceeded")) {
      return {
        error: "O arquivo é muito grande. O tamanho máximo permitido é 10MB. Por favor, escolha um arquivo menor.",
      } as const;
    }
    
    return {
      error: err instanceof Error ? err.message : "Erro ao fazer upload do arquivo.",
    } as const;
  }
}

export async function getComprovacoesAction(demandaId: string): Promise<DemandaComprovacao[]> {
  const comprovacaoRepository = getDemandaComprovacaoRepository();
  return comprovacaoRepository.findByDemandaId(demandaId);
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

  try {
    const comprovacaoRepository = getDemandaComprovacaoRepository();
    await comprovacaoRepository.remove(id);
    revalidatePath("/");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao remover comprovação.",
    } as const;
  }
}
