import type { Agencia, Demanda } from "@/types/globals";
import type { IPendingReminderConfigRepository } from "@/lib/domain/pending-reminder-config.repository";
import type { ISmtpConfigRepository } from "@/lib/domain/smtp-config.repository";
import type { IOrdemCompraRepository } from "@/lib/domain/ordem-compra.repository";
import type { IDemandaRepository } from "@/lib/domain/demanda.repository";
import type { IUserRepository } from "@/lib/domain/user.repository";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import {
  buildPendingComprovacoesAgencyEmail,
  buildPendingRemindersListEmail,
  type PendingComprovacaoItem,
  type PendingOrdemCompraItem,
} from "@/lib/email/pending-reminder-emails";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";
import { logUseCaseError, logUseCaseInfo } from "@/lib/server-action-log";
import { formatStatusLabel } from "./record-demanda-historico.use-case";

type Dependencies = {
  pendingReminderConfigRepository: IPendingReminderConfigRepository;
  smtpConfigRepository: ISmtpConfigRepository;
  ordemCompraRepository: IOrdemCompraRepository;
  demandaRepository: IDemandaRepository;
  userRepository: IUserRepository;
  agenciaRepository: IAgenciaRepository;
  appBaseUrl: string;
  now?: Date;
};

export type PendingRemindersResult = {
  skipped?: string;
  ordensPendentes: number;
  comprovacoesPendentes: number;
  emailsEnviados: number;
  falhas: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_TIMEZONE = "America/Sao_Paulo";
const MAX_OPEN_ORDERS = 1000;

function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: REMINDER_TIMEZONE }).format(date);
}

function daysSince(iso: string | undefined, now: Date): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((now.getTime() - time) / DAY_MS);
}

function uniqueEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  return emails
    .map((e) => e.trim())
    .filter((e) => {
      const key = e.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function resolveAgencia(demanda: Demanda, agencias: Agencia[]): Agencia | undefined {
  if (demanda.agenciaId) {
    const byId = agencias.find((a) => a.id === demanda.agenciaId);
    if (byId) return byId;
  }
  const nome = demanda.agencia?.trim().toLowerCase();
  if (!nome) return undefined;
  return agencias.find((a) => a.nomeFantasia.trim().toLowerCase() === nome);
}

function summarize(result: PendingRemindersResult): string {
  if (result.skipped) return result.skipped;
  return `${result.ordensPendentes} OC(s) sem assinatura, ${result.comprovacoesPendentes} demanda(s) sem comprovação, ${result.emailsEnviados} e-mail(s) enviado(s)${result.falhas > 0 ? `, ${result.falhas} falha(s)` : ""}.`;
}

/**
 * Envia por e-mail o resumo diário de pendências:
 * - Lista do Sebrae (SMTP): OCs em aberto há N dias + demandas Entregue/Faturado sem comprovação há N dias.
 * - Usuários de cada agência: suas demandas sem comprovação.
 * Roda no máximo uma vez por dia (fuso de São Paulo), salvo `force` (envio manual pelo admin).
 */
export async function sendPendingRemindersUseCase(
  options: { force?: boolean },
  deps: Dependencies
): Promise<PendingRemindersResult> {
  const now = deps.now ?? new Date();
  const result: PendingRemindersResult = {
    ordensPendentes: 0,
    comprovacoesPendentes: 0,
    emailsEnviados: 0,
    falhas: 0,
  };

  const config = await deps.pendingReminderConfigRepository.get();
  if (!options.force) {
    if (!config?.enabled) {
      return { ...result, skipped: "Lembretes desativados." };
    }
    if (config.lastRunAt && localDateKey(new Date(config.lastRunAt)) === localDateKey(now)) {
      return { ...result, skipped: "Lembretes já enviados hoje." };
    }
  }

  const smtp = await deps.smtpConfigRepository.get();
  if (!smtp?.enabled || !smtp.smtpUser?.trim() || !smtp.smtpPassword?.trim()) {
    const skipped = { ...result, skipped: "E-mail (SMTP) desativado ou não configurado." };
    await deps.pendingReminderConfigRepository.registerRun(summarize(skipped));
    return skipped;
  }

  const ordemCompraDays = config?.ordemCompraDays ?? 3;
  const comprovacaoDays = config?.comprovacaoDays ?? 7;

  const { items: ordensEmAberto } = await deps.ordemCompraRepository.findPaginated(
    { status: "em_aberto" },
    { page: 1, limit: MAX_OPEN_ORDERS }
  );
  const agencias = await deps.agenciaRepository.findAll();

  const ordens: PendingOrdemCompraItem[] = [];
  for (const oc of ordensEmAberto) {
    const dias = daysSince(oc.createdAt, now);
    if (dias === null || dias < ordemCompraDays) continue;
    const demanda = await deps.demandaRepository.findById(oc.demandaId);
    ordens.push({
      demanda: oc.demandaDescricao,
      ocPi: oc.demandaOcPi,
      agencia: (demanda && resolveAgencia(demanda, agencias)?.nomeFantasia) || demanda?.agencia || "",
      nomeArquivo: oc.nomeArquivo,
      dias,
    });
  }
  ordens.sort((a, b) => b.dias - a.dias);

  const demandasSemComprovacao = await deps.demandaRepository.findAll({
    statusIn: ["entregue", "faturado"],
    comprovacao: "nao_comprovado",
  });
  const comprovacoesPorAgencia = new Map<string, PendingComprovacaoItem[]>();
  const comprovacoes: PendingComprovacaoItem[] = [];
  for (const demanda of demandasSemComprovacao) {
    const dias = daysSince(demanda.updatedAt ?? demanda.createdAt, now);
    if (dias === null || dias < comprovacaoDays) continue;
    const agencia = resolveAgencia(demanda, agencias);
    const item: PendingComprovacaoItem = {
      demanda: demanda.demanda,
      ocPi: demanda.ocPi,
      agencia: agencia?.nomeFantasia ?? demanda.agencia ?? "",
      status: formatStatusLabel(demanda.status),
      valor: demanda.valor,
      dias,
    };
    comprovacoes.push(item);
    if (agencia) {
      comprovacoesPorAgencia.set(agencia.id, [...(comprovacoesPorAgencia.get(agencia.id) ?? []), item]);
    }
  }
  comprovacoes.sort((a, b) => b.dias - a.dias);

  result.ordensPendentes = ordens.length;
  result.comprovacoesPendentes = comprovacoes.length;

  async function send(to: string[], email: { subject: string; html: string; text: string }, ctx: Record<string, unknown>) {
    try {
      await sendSmtpMail(smtp!, { to: to.join(", "), ...email });
      result.emailsEnviados++;
    } catch (err) {
      result.falhas++;
      await logUseCaseError("sendPendingRemindersUseCase", err, ctx);
    }
  }

  const listaSebrae = uniqueEmails(smtp.ordemCompraNotifyEmails);
  if (listaSebrae.length > 0 && (ordens.length > 0 || comprovacoes.length > 0)) {
    await send(
      listaSebrae,
      buildPendingRemindersListEmail({
        ordens,
        comprovacoes,
        ordemCompraDays,
        comprovacaoDays,
        ordensCompraUrl: `${deps.appBaseUrl}/ordens-compra`,
        demandasUrl: `${deps.appBaseUrl}/`,
      }),
      { phase: "notify_list" }
    );
  }

  if (comprovacoesPorAgencia.size > 0) {
    const users = await deps.userRepository.findAll();
    for (const [agenciaId, itens] of comprovacoesPorAgencia) {
      const destinatarios = uniqueEmails(
        users
          .filter((u) => u.role === "agency" && u.acesso && u.agenciaId === agenciaId)
          .map((u) => u.email)
      );
      if (destinatarios.length === 0) continue;
      const agencia = agencias.find((a) => a.id === agenciaId);
      await send(
        destinatarios,
        buildPendingComprovacoesAgencyEmail({
          agenciaNome: agencia?.nomeFantasia ?? "Agência",
          comprovacoes: itens.sort((a, b) => b.dias - a.dias),
          comprovacaoDays,
          adicionarComprovacaoUrl: `${deps.appBaseUrl}/comprovacoes/adicionar`,
        }),
        { phase: "agency", agenciaId }
      );
    }
  }

  await deps.pendingReminderConfigRepository.registerRun(summarize(result));
  await logUseCaseInfo("sendPendingRemindersUseCase", "Lembretes de pendências processados", {
    ...result,
    force: options.force ?? false,
  });
  return result;
}
