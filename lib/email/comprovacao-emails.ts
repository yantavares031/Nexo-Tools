import { formatBrazilianCurrency } from "@/lib/currency";
import {
  buildEmailTitleWithSuccessCheck,
  emailKeywordHighlight,
} from "@/lib/email/email-text-styles";
import { escapeHtml } from "@/lib/email/html-escape";
import {
  buildDemandaResumoInnerHtml,
  truncateForSubject,
} from "@/lib/email/ordem-compra-emails";
import { buildSystemEmailHtml } from "@/lib/email/system-email-template";
import type { Demanda } from "@/types/globals";

const attachmentNote =
  "O arquivo da comprovação está anexado a este e-mail.";

/** Notificação para a lista SMTP — comprovação enviada pela agência (arquivo anexo + demandas vinculadas). */
export function buildComprovacaoNotificacaoListaEmail(params: {
  agenciaNome: string;
  demandas: Demanda[];
  nomeArquivo: string;
  descricao?: string;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, demandas, nomeArquivo, descricao } = params;
  const safeAg = escapeHtml(agenciaNome);
  const safeFile = escapeHtml(nomeArquivo);
  const demandasHtml =
    demandas.length === 0
      ? `<p style="margin:0 0 16px 0;font-size:14px;color:#64748b;">Nenhum detalhe de demanda disponível.</p>`
      : demandas
          .map(
            (d, i) => `
    <p style="margin:${i === 0 ? "0" : "20px"} 0 8px 0;font-size:13px;font-weight:600;color:#64748b;">Demanda ${i + 1}</p>
    ${buildDemandaResumoInnerHtml(d)}
  `
          )
          .join("");

  const descBlock =
    descricao?.trim() ?
      `<p style="margin:0 0 16px 0;font-size:14px;color:#334155;"><strong>Descrição:</strong> ${escapeHtml(descricao.trim())}</p>`
    : "";

  const innerHtml = `
    <p style="margin:0 0 16px 0;">A agência <strong>${safeAg}</strong> cadastrou uma ${emailKeywordHighlight("comprovação")} no ${emailKeywordHighlight("NEXO Tools")} e ${emailKeywordHighlight("vinculou")} à(s) demanda(s) abaixo.</p>
    ${descBlock}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo:</strong> ${safeFile}</p>
    <p style="margin:0 0 20px 0;font-size:13px;color:#64748b;">O arquivo da comprovação está ${emailKeywordHighlight("anexado")} a este e-mail.</p>
    ${demandasHtml}
  `.trim();

  const primeira = demandas[0]?.demanda?.trim() || "comprovação";
  const subject = `NEXO Tools — Nova comprovação (${agenciaNome}) · ${truncateForSubject(primeira)}`;

  const linhasDemandas = demandas
    .map(
      (d, i) =>
        `\n--- Demanda ${i + 1} ---\n${d.demanda}\nSolicitante: ${d.solicitante}\nValor: R$ ${formatBrazilianCurrency(d.valor)}\n`
    )
    .join("\n");
  const text = `A agência ${agenciaNome} cadastrou uma comprovação.\nArquivo: ${nomeArquivo}\n${descricao?.trim() ? `Descrição: ${descricao.trim()}\n` : ""}\n${attachmentNote}\nDemandas vinculadas:${linhasDemandas || "\n(nenhuma)"}\n`;

  const html = buildSystemEmailHtml({
    preheader: `${agenciaNome} enviou uma comprovação com arquivo anexo.`,
    title: "Nova comprovação — agência",
    titleHtml: buildEmailTitleWithSuccessCheck("Nova comprovação — agência"),
    innerHtml,
  });

  return { subject, html, text };
}
