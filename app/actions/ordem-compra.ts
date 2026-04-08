"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { randomUUID } from "crypto";
import {
  buildOrdemCompraAgenciaObjectKey,
  buildOrdemCompraAssinadoObjectKey,
  putAppObjectToR2,
} from "@/lib/r2-upload";
import { readStoredUploadFile } from "@/lib/stored-upload";
import { getSession } from "@/lib/auth";
import {
  getAgencyDemandaScope,
  demandaMatchesAgenciaScope,
} from "@/lib/agency-demanda-scope";
import { getOrdemCompraRepository, getDemandaRepository } from "@/lib/repositories";
import { createOrdemCompraUseCase } from "@/lib/use-cases/create-ordem-compra.use-case";
import { registrarOrdemCompraAssinadaComArquivoUseCase } from "@/lib/use-cases/registrar-ordem-compra-assinada-com-arquivo.use-case";
import { removeOrdemCompraEmAbertoUseCase } from "@/lib/use-cases/remove-ordem-compra-em-aberto.use-case";
import type { OrdemCompra, OrdemCompraStatus } from "@/types/globals";
import type { OrdemCompraPaginatedResult } from "@/lib/domain/ordem-compra.repository";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "ordens-compra");
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export async function createOrdemCompraAction(
  formData: FormData
): Promise<{ error?: string; ordemCompra?: OrdemCompra }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." };
  }
  if (session.role !== "agency") {
    return { error: "Apenas usuários de agência podem enviar pedidos de OC." };
  }

  const demandaId = (formData.get("demandaId") as string)?.trim();
  if (!demandaId) {
    return { error: "Selecione uma demanda." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Envie o documento PDF da OC." };
  }

  const ext = getFileExtension(file.name);
  if (ext !== ".pdf") {
    return { error: "Apenas arquivos PDF são aceitos para ordem de compra." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  try {
    const scope = await getAgencyDemandaScope(session);
    if (!scope) {
      return { error: "Usuário do tipo Agência sem agência vinculada." };
    }

    const demandaRepository = getDemandaRepository();
    const demanda = await demandaRepository.findById(demandaId);
    if (!demanda) {
      return { error: "Demanda não encontrada." };
    }
    if (!demandaMatchesAgenciaScope(demanda, scope)) {
      return { error: "Você não tem permissão para vincular esta demanda." };
    }

    const ordemId = randomUUID();
    const fileId = randomUUID();
    const objectKey = buildOrdemCompraAgenciaObjectKey(ordemId, fileId, ext);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await putAppObjectToR2({
      key: objectKey,
      body: buffer,
      contentType: "application/pdf",
    });

    const ordemCompraRepository = getOrdemCompraRepository();
    const ordemCompra = await createOrdemCompraUseCase(
      {
        id: ordemId,
        demandaId,
        nomeArquivo: file.name,
        tipoArquivo: ext,
        tamanho: file.size,
        caminhoArquivo: objectKey,
        autor: session.name ?? "",
      },
      { ordemCompraRepository }
    );

    revalidatePath("/ordens-compra");
    revalidatePath("/ordens-compra/adicionar");
    return { ordemCompra };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Body exceeded")) {
      return { error: "O arquivo é muito grande." };
    }
    return {
      error: err instanceof Error ? err.message : "Erro ao enviar ordem de compra.",
    };
  }
}

export async function getOrdensCompraPaginatedAction(
  page: number,
  limit: number,
  options?: { q?: string; status?: OrdemCompraStatus }
): Promise<OrdemCompraPaginatedResult> {
  const session = await getSession();
  const ordemCompraRepository = getOrdemCompraRepository();

  if (!session) {
    return {
      items: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 1,
    };
  }

  const agencyScope = await getAgencyDemandaScope(session);
  const agenciaId = agencyScope?.agenciaId;
  const agenciaNomeLegacy = agencyScope?.agenciaNomeLegacy;
  const q = options?.q?.trim() || undefined;
  const status = options?.status;

  if (session.role === "agency" && !agenciaId) {
    return {
      items: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 1,
    };
  }

  const filters =
    session.role === "agency"
      ? { agenciaId, agenciaNomeLegacy, q, status }
      : { q, status };

  return ordemCompraRepository.findPaginated(filters, { page, limit });
}

/** Lista pedidos de OC da demanda (detalhes da demanda), respeitando escopo de agência. */
export async function getOrdensCompraPorDemandaAction(
  demandaId: string
): Promise<OrdemCompra[]> {
  const session = await getSession();
  if (!session) return [];

  const trimmed = demandaId?.trim();
  if (!trimmed) return [];

  const demandaRepository = getDemandaRepository();
  const demanda = await demandaRepository.findById(trimmed);
  if (!demanda) return [];

  const ordemCompraRepository = getOrdemCompraRepository();

  if (session.role === "admin" || session.role === "operator") {
    return ordemCompraRepository.findByDemandaId(trimmed);
  }
  if (session.role === "agency") {
    const scope = await getAgencyDemandaScope(session);
    if (!scope || !demandaMatchesAgenciaScope(demanda, scope)) {
      return [];
    }
    return ordemCompraRepository.findByDemandaId(trimmed);
  }

  return [];
}

export async function downloadOrdemCompraAction(
  id: string,
  options?: { versao?: "original" | "assinada" }
): Promise<{
  error?: string;
  file?: { buffer: Buffer; nomeArquivo: string; tipoArquivo: string };
}> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." };
  }

  const versao = options?.versao === "assinada" ? "assinada" : "original";
  const ordemCompraRepository = getOrdemCompraRepository();
  const demandaRepository = getDemandaRepository();
  const ordem = await ordemCompraRepository.findById(id);
  if (!ordem) {
    return { error: "Ordem de compra não encontrada." };
  }

  if (session.role === "admin") {
    // ok
  } else if (session.role === "agency") {
    const scope = await getAgencyDemandaScope(session);
    if (!scope) {
      return { error: "Sem permissão." };
    }
    const demanda = await demandaRepository.findById(ordem.demandaId);
    if (!demanda || !demandaMatchesAgenciaScope(demanda, scope)) {
      return { error: "Sem permissão." };
    }
    if (versao === "assinada" && ordem.status !== "assinada") {
      return { error: "A OC assinada ainda não está disponível." };
    }
  } else {
    return { error: "Sem permissão." };
  }

  const caminho =
    versao === "assinada" ? ordem.caminhoArquivoAssinado : ordem.caminhoArquivo;
  const nomeArquivo =
    versao === "assinada" ? ordem.nomeArquivoAssinado : ordem.nomeArquivo;
  const tipoArquivo =
    versao === "assinada" ? ordem.tipoArquivoAssinado : ordem.tipoArquivo;

  if (versao === "assinada" && (!caminho || !nomeArquivo || !tipoArquivo)) {
    return { error: "Arquivo da OC assinada não encontrado." };
  }

  try {
    const buffer = await readStoredUploadFile(caminho!, UPLOADS_DIR);
    return {
      file: {
        buffer,
        nomeArquivo: nomeArquivo!,
        tipoArquivo: tipoArquivo!,
      },
    };
  } catch {
    return { error: "Arquivo não encontrado." };
  }
}

export async function uploadOrdemCompraAssinadaAction(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." };
  }
  if (session.role !== "admin") {
    return { error: "Apenas administradores podem registrar a OC assinada." };
  }

  const ordemId = (formData.get("ordemCompraId") as string)?.trim();
  if (!ordemId) {
    return { error: "Pedido inválido." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Envie o PDF da OC já assinada." };
  }

  const ext = getFileExtension(file.name);
  if (ext !== ".pdf") {
    return { error: "Apenas arquivos PDF são aceitos." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  try {
    const fileId = randomUUID();
    const objectKey = buildOrdemCompraAssinadoObjectKey(ordemId, fileId, ext);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await putAppObjectToR2({
      key: objectKey,
      body: buffer,
      contentType: "application/pdf",
    });

    const ordemCompraRepository = getOrdemCompraRepository();
    await registrarOrdemCompraAssinadaComArquivoUseCase(
      ordemId,
      {
        nomeArquivoAssinado: file.name,
        tipoArquivoAssinado: ext,
        tamanhoAssinado: file.size,
        caminhoArquivoAssinado: objectKey,
      },
      { ordemCompraRepository }
    );

    revalidatePath("/ordens-compra");
    return {};
  } catch (err) {
    if (err instanceof Error && err.message.includes("Body exceeded")) {
      return { error: "O arquivo é muito grande." };
    }
    return {
      error: err instanceof Error ? err.message : "Erro ao registrar OC assinada.",
    };
  }
}

export async function removeOrdemCompraEmAbertoAction(
  id: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "Não autenticado." };
  }
  if (session.role !== "admin" && session.role !== "agency") {
    return { error: "Sem permissão para remover pedidos de OC." };
  }

  const ordemId = id?.trim();
  if (!ordemId) {
    return { error: "Pedido inválido." };
  }

  try {
    const ordemCompraRepository = getOrdemCompraRepository();
    const demandaRepository = getDemandaRepository();

    if (session.role === "admin") {
      await removeOrdemCompraEmAbertoUseCase(
        ordemId,
        { ordemCompraRepository, demandaRepository },
        { actor: "admin" }
      );
    } else {
      const scope = await getAgencyDemandaScope(session);
      await removeOrdemCompraEmAbertoUseCase(
        ordemId,
        { ordemCompraRepository, demandaRepository },
        { actor: "agency", agencyScope: scope }
      );
    }

    revalidatePath("/ordens-compra");
    revalidatePath("/ordens-compra/adicionar");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao remover pedido de OC.",
    };
  }
}
