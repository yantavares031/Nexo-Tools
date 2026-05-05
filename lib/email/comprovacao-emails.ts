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

const fileNote =
  "Arquivo registrado no NEXO Tools. Consulte a plataforma para visualização e download.";

/** Notificação para a lista SMTP — comprovação cadastrada (sem anexos). Origem = agência ou usuário interno. */
export function buildComprovacaoNotificacaoListaEmail(params: {
  /** Nome fantasia da agência ou "Nome (Admin|Operador)" para usuário interno. */
  origemNome: string;
  demandas: Demanda[];
  nomeArquivo: string;
  descricao?: string;
}): { subject: string; html: string; text: string } {
  const { origemNome, demandas, nomeArquivo, descricao } = params;
  const safeOrigem = escapeHtml(origemNome);
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
    <p style="margin:0 0 16px 0;"><strong>${safeOrigem}</strong> cadastrou uma ${emailKeywordHighlight("comprovação")} no ${emailKeywordHighlight("NEXO Tools")} e ${emailKeywordHighlight("vinculou")} à(s) demanda(s) abaixo.</p>
    ${descBlock}
    <p style="margin:0 0 12px 0;font-size:14px;color:#334155;"><strong>Arquivo:</strong> ${safeFile}</p>
    <p style="margin:0 0 20px 0;font-size:13px;color:#64748b;">${escapeHtml(fileNote)}</p>
    ${demandasHtml}
  `.trim();

  const primeira = demandas[0]?.demanda?.trim() || "comprovação";
  const subject = `NEXO Tools — Nova comprovação (${origemNome}) · ${truncateForSubject(primeira)}`;

  const linhasDemandas = demandas
    .map(
      (d, i) =>
        `\n--- Demanda ${i + 1} ---\n${d.demanda}\nSolicitante: ${d.solicitante}\nValor: R$ ${formatBrazilianCurrency(d.valor)}\n`
    )
    .join("\n");
  const text = `${origemNome} cadastrou uma comprovação.\nArquivo: ${nomeArquivo}\n${descricao?.trim() ? `Descrição: ${descricao.trim()}\n` : ""}\n${fileNote}\nDemandas vinculadas:${linhasDemandas || "\n(nenhuma)"}\n`;

  const html = buildSystemEmailHtml({
    preheader: `${origemNome} enviou uma comprovação.`,
    title: "Nova comprovação",
    titleHtml: buildEmailTitleWithSuccessCheck("Nova comprovação"),
    innerHtml,
  });

  return { subject, html, text };
}
