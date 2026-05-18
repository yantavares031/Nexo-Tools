import {
  buildEmailTitleWithSuccessCheck,
  emailKeywordHighlight,
} from "@/lib/email/email-text-styles";
import { escapeHtml } from "@/lib/email/html-escape";
import { truncateForSubject } from "@/lib/email/ordem-compra-emails";
import { buildSystemEmailHtml } from "@/lib/email/system-email-template";

const fileNote =
  "Arquivo registrado no NEXO Tools. Consulte a plataforma para visualização e download.";

/** Notificação para a lista SMTP — certidão cadastrada (sem anexos, sem vínculo com demanda). */
export function buildCertidaoNotificacaoListaEmail(params: {
  origemNome: string;
  nomeArquivo: string;
  descricao?: string;
}): { subject: string; html: string; text: string } {
  const { origemNome, nomeArquivo, descricao } = params;
  const safeOrigem = escapeHtml(origemNome);
  const safeFile = escapeHtml(nomeArquivo);

  const descBlock =
    descricao?.trim() ?
      `<p style="margin:0 0 16px 0;font-size:14px;color:#334155;"><strong>Descrição:</strong> ${escapeHtml(descricao.trim())}</p>`
    : "";

  const innerHtml = `
    <p style="margin:0 0 16px 0;"><strong>${safeOrigem}</strong> cadastrou uma ${emailKeywordHighlight("certidão")} no ${emailKeywordHighlight("NEXO Tools")}.</p>
    ${descBlock}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo:</strong> ${safeFile}</p>
    <p style="margin:0;font-size:13px;color:#64748b;">${escapeHtml(fileNote)}</p>
  `.trim();

  const subject = `NEXO Tools — Nova certidão (${origemNome}) · ${truncateForSubject(nomeArquivo)}`;

  const text = `${origemNome} cadastrou uma certidão.\nArquivo: ${nomeArquivo}\n${descricao?.trim() ? `Descrição: ${descricao.trim()}\n` : ""}\n${fileNote}\n`;

  const html = buildSystemEmailHtml({
    preheader: `${origemNome} enviou uma certidão.`,
    title: "Nova certidão",
    titleHtml: buildEmailTitleWithSuccessCheck("Nova certidão"),
    innerHtml,
  });

  return { subject, html, text };
}
