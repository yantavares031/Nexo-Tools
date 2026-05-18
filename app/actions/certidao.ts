"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { getAgencyDemandaScope } from "@/lib/agency-demanda-scope";
import {
  getAgenciaRepository,
  getCertidaoRepository,
  getSmtpConfigRepository,
  getWhatsAppIntegrationRepository,
} from "@/lib/repositories";
import { getWhatsAppProvider } from "@/lib/infra/whatsapp/get-whatsapp-provider";
import { notifyCertidaoEnviadaEmailsUseCase } from "@/lib/use-cases/notify-certidao-enviada-emails.use-case";
import { notifyCertidaoEnviadaWhatsAppUseCase } from "@/lib/use-cases/notify-certidao-enviada-whatsapp.use-case";
import { canAccessCertidao } from "@/lib/certidao-access";
import type { Certidao } from "@/types/globals";
import type { CertidaoPaginatedResult } from "@/lib/domain/certidao.repository";
import { createCertidaoUseCase } from "@/lib/use-cases/create-certidao.use-case";
import { removeCertidaoUseCase } from "@/lib/use-cases/remove-certidao.use-case";
import {
  buildCertidaoObjectKey,
  putAppObjectToR2,
} from "@/lib/r2-upload";
import { readStoredUploadFile } from "@/lib/stored-upload";
import {
  entityIdSchema,
  paginationLimitSchema,
  paginationPageSchema,
} from "@/lib/validation/schemas/common";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "certidoes");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".xml",
  ".txt",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".jpg",
  ".jpeg",
  ".png",
];

function contentTypeForExt(ext: string): string {
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
  return ALLOWED_EXTENSIONS.includes(getFileExtension(filename));
}

export async function createCertidaoAction(
  formData: FormData
): Promise<{ error?: string; certidoes?: Certidao[] }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
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

  let agenciaId: string | undefined;
  let notificacaoOrigemNome: string | null = null;

  if (session.role === "agency") {
    const scope = await getAgencyDemandaScope(session);
    if (!scope?.agenciaId) {
      return { error: "Usuário do tipo Agência sem agência vinculada." } as const;
    }
    agenciaId = scope.agenciaId;
    let agenciaNome = "Agência";
    const ag = await getAgenciaRepository().findById(scope.agenciaId);
    if (ag?.nomeFantasia?.trim()) {
      agenciaNome = ag.nomeFantasia.trim();
    }
    notificacaoOrigemNome = agenciaNome;
  } else if (session.role === "admin" || session.role === "operator") {
    const roleSuffix = session.role === "admin" ? "Admin" : "Operador";
    const nome = session.name?.trim() || session.email || "Usuário";
    notificacaoOrigemNome = `${nome} (${roleSuffix})`;
  }

  try {
    const certidaoRepository = getCertidaoRepository();
    const smtpRepo = notificacaoOrigemNome ? getSmtpConfigRepository() : null;
    const smtpRow = smtpRepo ? await smtpRepo.get() : null;
    const certidoes: Certidao[] = [];
    const nomesArquivosEnviados: string[] = [];
    let whatsappCertidaoDisparado = false;

    for (const file of validFiles) {
      const fileId = randomUUID();
      const ext = getFileExtension(file.name);
      const objectKey = buildCertidaoObjectKey(fileId, ext);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await putAppObjectToR2({
        key: objectKey,
        body: buffer,
        contentType: contentTypeForExt(ext),
      });

      const certidao = await createCertidaoUseCase(
        {
          nomeArquivo: file.name,
          tipoArquivo: ext,
          tamanho: file.size,
          caminhoArquivo: objectKey,
          descricao,
          autor: session.name ?? "",
          cadastradoPorUserId: session.userId?.trim() || undefined,
          agenciaId,
        },
        { certidaoRepository }
      );
      certidoes.push(certidao);
      nomesArquivosEnviados.push(file.name);

      if (notificacaoOrigemNome && smtpRepo) {
        await notifyCertidaoEnviadaEmailsUseCase(
          {
            notifyEmails: smtpRow?.ordemCompraNotifyEmails ?? [],
            agenciaUserEmail: session.role === "agency" ? session.email : undefined,
            origemNome: notificacaoOrigemNome,
            nomeArquivo: file.name,
            descricao,
          },
          { smtpConfigRepository: smtpRepo }
        );
      }
    }

    if (notificacaoOrigemNome && nomesArquivosEnviados.length > 0 && !whatsappCertidaoDisparado) {
      await notifyCertidaoEnviadaWhatsAppUseCase(
        {
          nomesArquivos: nomesArquivosEnviados,
          enviadoPorUsuario: session.name?.trim() || session.email?.trim() || "—",
          descricao,
          refId: certidoes[0]?.id,
        },
        {
          whatsAppIntegrationRepository: getWhatsAppIntegrationRepository(),
          whatsAppProvider: getWhatsAppProvider("uazapi"),
        }
      );
      whatsappCertidaoDisparado = true;
    }

    revalidatePath("/certidoes");
    revalidatePath("/certidoes/adicionar");
    return { certidoes };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Body exceeded")) {
      return {
        error: "O arquivo é muito grande. O tamanho máximo permitido é 10MB por arquivo.",
      } as const;
    }
    await logServerActionError("createCertidaoAction", err, { fileCount: validFiles.length });
    return {
      error: err instanceof Error ? err.message : "Erro ao fazer upload do arquivo.",
    } as const;
  }
}

export async function getCertidoesPaginatedAction(
  page: number,
  limit: number,
  filters?: { q?: string; mes?: string; agenciaId?: string }
): Promise<CertidaoPaginatedResult> {
  const session = await getSession();
  const pageParsed = paginationPageSchema.safeParse(page);
  const limitParsed = paginationLimitSchema.safeParse(limit);
  const safePage = pageParsed.success ? pageParsed.data : 1;
  const safeLimit = limitParsed.success ? limitParsed.data : 20;
  const certidaoRepository = getCertidaoRepository();
  const agencyScope = await getAgencyDemandaScope(session);
  let agenciaId: string | undefined;
  if (session?.role === "agency") {
    agenciaId = agencyScope?.agenciaId;
  } else if (session?.role === "admin") {
    agenciaId = filters?.agenciaId?.trim() || undefined;
  }
  const q = filters?.q?.trim() || undefined;
  const mesRaw = filters?.mes?.trim() || undefined;
  const mes = mesRaw && /^\d{4}-\d{2}$/.test(mesRaw) ? mesRaw : undefined;
  return certidaoRepository.findPaginated({ agenciaId, mes, q }, { page: safePage, limit: safeLimit });
}

export async function downloadCertidaoAction(id: string): Promise<{
  error?: string;
  file?: { buffer: Buffer; nomeArquivo: string; tipoArquivo: string };
}> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }

  const idCheck = entityIdSchema.safeParse(id);
  if (!idCheck.success) {
    return { error: zodErrorToActionMessage(idCheck.error) } as const;
  }

  const certidaoRepository = getCertidaoRepository();
  const certidao = await certidaoRepository.findById(idCheck.data);

  if (!certidao) {
    return { error: "Certidão não encontrada." } as const;
  }

  const allowed = await canAccessCertidao(session, certidao);
  if (!allowed) {
    return { error: "Sem permissão para acessar esta certidão." } as const;
  }

  try {
    const buffer = await readStoredUploadFile(certidao.caminhoArquivo, UPLOADS_DIR);
    return {
      file: {
        buffer,
        nomeArquivo: certidao.nomeArquivo,
        tipoArquivo: certidao.tipoArquivo,
      },
    };
  } catch (err) {
    await logServerActionError("downloadCertidaoAction", err, { id: idCheck.data });
    return { error: "Arquivo não encontrado." } as const;
  }
}

export async function removeCertidaoAction(id: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." } as const;
  }
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem remover certidões." } as const;
  }

  const idCheck = entityIdSchema.safeParse(id);
  if (!idCheck.success) {
    return { error: zodErrorToActionMessage(idCheck.error) } as const;
  }

  try {
    const certidaoRepository = getCertidaoRepository();
    await removeCertidaoUseCase(idCheck.data, { certidaoRepository });
    revalidatePath("/certidoes");
    revalidatePath("/certidoes/adicionar");
    return {};
  } catch (err) {
    await logServerActionError("removeCertidaoAction", err, { id: idCheck.data });
    return {
      error: err instanceof Error ? err.message : "Erro ao remover certidão.",
    } as const;
  }
}
