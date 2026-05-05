import { formatBrazilianCurrency } from "@/lib/currency";
import {
  buildEmailTitleWithSuccessCheck,
  emailKeywordHighlight,
} from "@/lib/email/email-text-styles";
import { escapeHtml } from "@/lib/email/html-escape";
import { buildSystemEmailHtml } from "@/lib/email/system-email-template";
import type { Demanda, StatusDemanda } from "@/types/globals";

function statusLabel(status: StatusDemanda): string {
  const map: Record<StatusDemanda, string> = {
    faturado: "Faturado",
    comprometido: "Comprometido",
    entregue: "Entregue",
  };
  return map[status] ?? status;
}

function formatMesExibicao(mes: string): string {
  const t = mes.trim();
  const p = t.split("-");
  if (p.length === 2 && /^\d{4}$/.test(p[0]) && /^\d{1,2}$/.test(p[1])) {
    return `${p[1].padStart(2, "0")}/${p[0]}`;
  }
  return t;
}

export function truncateForSubject(text: string, max = 48): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;width:38%;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;vertical-align:top;">${escapeHtml(value)}</td></tr>`;
}

/** Bloco HTML com resumo da demanda (valores escapados). */
export function buildDemandaResumoInnerHtml(demanda: Demanda): string {
  const valor = `R$ ${formatBrazilianCurrency(demanda.valor)}`;
  const agencia = demanda.agencia?.trim() || "—";
  const rows: [string, string][] = [
    ["Demanda", demanda.demanda],
    ["Solicitante", demanda.solicitante],
    ["Un. responsável", demanda.unResponsavel],
    ["Status", statusLabel(demanda.status)],
    ["Valor", valor],
    ["Centro de custo", demanda.centroDeCusto || "—"],
    ["OC / PI", demanda.ocPi || "—"],
    ["Mês", formatMesExibicao(demanda.mes)],
    ["Agência (demanda)", agencia],
  ];
  if (demanda.obs?.trim()) {
    rows.push(["Observações", demanda.obs.trim()]);
  }
  const body = rows.map(([l, v]) => row(l, v)).join("");
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 20px 0;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">
      <tbody>${body}</tbody>
    </table>
  `.trim();
}

const filePlatformNote =
  "Arquivo registrado no NEXO Tools. Consulte a plataforma para visualização e download.";

/** Notificação para a lista configurada em SMTP — OC enviada pela agência (sem anexos). */
export function buildOcEnviadaNotificacaoListaEmail(params: {
  agenciaNome: string;
  demanda: Demanda;
  nomeArquivoPdf: string;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, demanda, nomeArquivoPdf } = params;
  const safeAg = escapeHtml(agenciaNome);
  const safeFile = escapeHtml(nomeArquivoPdf);
  const innerHtml = `
    <p style="margin:0 0 16px 0;">A agência <strong>${safeAg}</strong> anexou uma ${emailKeywordHighlight("ordem de compra")} no ${emailKeywordHighlight("NEXO Tools")}, referente à demanda abaixo.</p>
    <p style="margin:0 0 16px 0;">O documento aguarda ${emailKeywordHighlight("assinatura do administrador")}.</p>
    ${buildDemandaResumoInnerHtml(demanda)}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo:</strong> ${safeFile}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(filePlatformNote)}</p>
  `.trim();
  const subject = `NEXO Tools — ${agenciaNome} enviou OC · ${truncateForSubject(demanda.demanda)}`;
  const text = `A agência ${agenciaNome} anexou uma ordem de compra referente à demanda: ${demanda.demanda}\n\nArquivo: ${nomeArquivoPdf}\n\n${filePlatformNote}\n`;
  const html = buildSystemEmailHtml({
    preheader: `${agenciaNome} anexou uma ordem de compra.`,
    title: "Nova ordem de compra enviada",
    titleHtml: buildEmailTitleWithSuccessCheck("Nova ordem de compra enviada"),
    innerHtml,
  });
  return { subject, html, text };
}

/** Cópia para o usuário da agência — backup das informações (sem anexos). */
export function buildOcEnviadaBackupAgenciaEmail(params: {
  agenciaNome: string;
  demanda: Demanda;
  nomeArquivoPdf: string;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, demanda, nomeArquivoPdf } = params;
  const safeAg = escapeHtml(agenciaNome);
  const safeFile = escapeHtml(nomeArquivoPdf);
  const innerHtml = `
    <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Agência: <strong>${safeAg}</strong></p>
    <p style="margin:0 0 16px 0;">Sua ordem de compra foi ${emailKeywordHighlight("enviada com sucesso")} para a demanda abaixo e está ${emailKeywordHighlight("aguardando assinatura")} pelo administrador.</p>
    ${buildDemandaResumoInnerHtml(demanda)}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo enviado:</strong> ${safeFile}</p>
    <p style="margin:0 0 16px 0;padding:12px 14px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px;color:#1e3a8a;line-height:1.5;">
      <strong>Atenção:</strong> este e-mail é apenas para <strong>backup das informações</strong>. O fluxo oficial continua no NEXO Tools.
    </p>
    <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(filePlatformNote)}</p>
  `.trim();
  const subject = `NEXO Tools — OC enviada (aguardando assinatura) · ${truncateForSubject(demanda.demanda)}`;
  const text = `Agência: ${agenciaNome}\n\nOC enviada com sucesso para a demanda: ${demanda.demanda}\nArquivo: ${nomeArquivoPdf}\n\nEste e-mail é apenas backup das informações.\n\n${filePlatformNote}\n`;
  const html = buildSystemEmailHtml({
    preheader: "Confirmação de envio da sua ordem de compra.",
    title: "OC enviada — aguardando assinatura",
    titleHtml: buildEmailTitleWithSuccessCheck("OC enviada — aguardando assinatura"),
    innerHtml,
  });
  return { subject, html, text };
}

const signedFilePlatformNote =
  "O PDF assinado está disponível no NEXO Tools para visualização e download.";

/** Agência: OC foi assinada; aviso + link para o painel (sem anexos). */
export function buildOcAssinadaAgenciaEmail(params: {
  agenciaNome: string;
  demanda: Demanda;
  ordensCompraUrl: string;
  nomeArquivoPdfAssinado: string;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, demanda, ordensCompraUrl, nomeArquivoPdfAssinado } = params;
  const safeUrl = escapeHtml(ordensCompraUrl);
  const safeFile = escapeHtml(nomeArquivoPdfAssinado);
  const innerHtml = `
    <p style="margin:0 0 16px 0;">A ordem de compra referente à demanda abaixo foi ${emailKeywordHighlight("assinada")} e já está ${emailKeywordHighlight("disponível na plataforma")} ${emailKeywordHighlight("NEXO Tools")}.</p>
    ${buildDemandaResumoInnerHtml(demanda)}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#2563eb;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Abrir Ordens de compra</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo assinado:</strong> ${safeFile}</p>
    <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Use o link acima após entrar no sistema para baixar a ${emailKeywordHighlight("versão assinada")} quando precisar.</p>
    <p style="margin:0 0 16px 0;font-size:13px;color:#64748b;">${escapeHtml(signedFilePlatformNote)}</p>
    <p style="margin:0;padding:12px 14px;background-color:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#475569;line-height:1.5;">
      <strong>Backup:</strong> guarde este e-mail como referência. O arquivo oficial permanece no NEXO Tools.<br />
      <span style="word-break:break-all;color:#2563eb;">${safeUrl}</span>
    </p>
  `.trim();
  const subject = `NEXO Tools — OC assinada · ${truncateForSubject(demanda.demanda)}`;
  const text = `A ordem de compra da demanda "${demanda.demanda}" foi assinada e está disponível na plataforma.\n\nAgência: ${agenciaNome}\nArquivo assinado: ${nomeArquivoPdfAssinado}\n\n${signedFilePlatformNote}\n\nAcesse: ${ordensCompraUrl}\n`;
  const html = buildSystemEmailHtml({
    preheader: "Sua ordem de compra foi assinada.",
    title: "Ordem de compra assinada",
    titleHtml: buildEmailTitleWithSuccessCheck("Ordem de compra assinada"),
    innerHtml,
  });
  return { subject, html, text };
}

/** Lista SMTP: confirmação de assinatura + status de aviso da agência (sem anexos). */
export function buildOcAssinadaNotificacaoListaEmail(params: {
  agenciaNome: string;
  demanda: Demanda;
  nomeArquivoPdfAssinado: string;
  agenciaNotificada: boolean;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, demanda, nomeArquivoPdfAssinado, agenciaNotificada } = params;
  const safeAg = escapeHtml(agenciaNome);
  const safeFile = escapeHtml(nomeArquivoPdfAssinado);
  const aviso = agenciaNotificada
    ? `A agência <strong>${safeAg}</strong> já foi ${emailKeywordHighlight("notificada por e-mail")} sobre a ${emailKeywordHighlight("assinatura")}.`
    : `Não foi possível identificar o e-mail de quem enviou a OC; a agência <strong>${safeAg}</strong> pode precisar ser ${emailKeywordHighlight("avisada manualmente")}.`;
  const innerHtml = `
    <p style="margin:0 0 16px 0;">Uma ${emailKeywordHighlight("ordem de compra assinada")} foi ${emailKeywordHighlight("registrada")} no ${emailKeywordHighlight("NEXO Tools")}.</p>
    ${buildDemandaResumoInnerHtml(demanda)}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo assinado:</strong> ${safeFile}</p>
    <p style="margin:0 0 16px 0;padding:12px 14px;background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:14px;color:#065f46;line-height:1.5;">${aviso}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">${emailKeywordHighlight("PDF assinado")} disponível no NEXO Tools para arquivo e consulta.</p>
  `.trim();
  const subject = `NEXO Tools — OC assinada registrada · ${truncateForSubject(demanda.demanda)}`;
  const text = `OC assinada registrada.\nDemanda: ${demanda.demanda}\nAgência: ${agenciaNome}\nArquivo: ${nomeArquivoPdfAssinado}\n\n${agenciaNotificada ? `A agência ${agenciaNome} foi notificada por e-mail.` : "Verifique se a agência precisa ser avisada manualmente."}\n\nPDF assinado disponível no NEXO Tools.\n`;
  const html = buildSystemEmailHtml({
    preheader: "OC assinada registrada no NEXO Tools.",
    title: "OC assinada — cópia para arquivo",
    titleHtml: buildEmailTitleWithSuccessCheck("OC assinada — cópia para arquivo"),
    innerHtml,
  });
  return { subject, html, text };
}
