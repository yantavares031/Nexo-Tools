import { formatBrazilianCurrency } from "@/lib/currency";
import { emailKeywordHighlight } from "@/lib/email/email-text-styles";
import { escapeHtml } from "@/lib/email/html-escape";
import { buildSystemEmailHtml } from "@/lib/email/system-email-template";

const MAX_ROWS_PER_SECTION = 50;

export type PendingOrdemCompraItem = {
  demanda: string;
  ocPi: string;
  agencia: string;
  nomeArquivo: string;
  dias: number;
};

export type PendingComprovacaoItem = {
  demanda: string;
  ocPi: string;
  agencia: string;
  status: string;
  valor: number;
  dias: number;
};

const cellStyle =
  "padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:left;vertical-align:top;";
const headStyle =
  "padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#64748b;text-align:left;background-color:#f8fafc;";

function diasLabel(dias: number): string {
  return dias === 1 ? "1 dia" : `${dias} dias`;
}

function buildTable(headers: string[], rows: string[][], total: number): string {
  const head = headers.map((h) => `<th style="${headStyle}">${escapeHtml(h)}</th>`).join("");
  const body = rows
    .slice(0, MAX_ROWS_PER_SECTION)
    .map((r) => `<tr>${r.map((c) => `<td style="${cellStyle}">${escapeHtml(c)}</td>`).join("")}</tr>`)
    .join("");
  const more =
    total > MAX_ROWS_PER_SECTION
      ? `<p style="margin:8px 0 0 0;font-size:12px;color:#64748b;">e mais ${total - MAX_ROWS_PER_SECTION} item(ns). Consulte a lista completa no NEXO Tools.</p>`
      : "";
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 4px 0;border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;overflow:hidden;">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
    ${more}
  `.trim();
}

function buildButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:12px 0 24px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#2563eb;">
          <a href="${safeHref}" style="display:inline-block;padding:10px 18px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `.trim();
}

function ordensSection(ordens: PendingOrdemCompraItem[], ordensCompraUrl: string, days: number): string {
  if (ordens.length === 0) return "";
  const rows = ordens.map((o) => [o.demanda, o.ocPi || "—", o.agencia || "—", o.nomeArquivo, diasLabel(o.dias)]);
  return `
    <h2 style="margin:0 0 8px 0;font-size:15px;color:#0f172a;">Ordens de compra aguardando assinatura (${ordens.length})</h2>
    <p style="margin:0 0 12px 0;font-size:13px;color:#475569;">Pedidos enviados pelas agências há ${diasLabel(days)} ou mais e ainda ${emailKeywordHighlight("sem assinatura")}.</p>
    ${buildTable(["Demanda", "OC/PI", "Agência", "Arquivo", "Em aberto há"], rows, ordens.length)}
    ${buildButton(ordensCompraUrl, "Abrir Ordens de compra")}
  `.trim();
}

function comprovacoesSection(
  comprovacoes: PendingComprovacaoItem[],
  actionUrl: string,
  actionLabel: string,
  days: number,
  showAgencia: boolean
): string {
  if (comprovacoes.length === 0) return "";
  const headers = showAgencia
    ? ["Demanda", "OC/PI", "Agência", "Status", "Valor", "Sem comprovação há"]
    : ["Demanda", "OC/PI", "Status", "Valor", "Sem comprovação há"];
  const rows = comprovacoes.map((c) => {
    const base = [c.demanda, c.ocPi || "—"];
    if (showAgencia) base.push(c.agencia || "—");
    return [...base, c.status, `R$ ${formatBrazilianCurrency(c.valor)}`, diasLabel(c.dias)];
  });
  return `
    <h2 style="margin:0 0 8px 0;font-size:15px;color:#0f172a;">Demandas aguardando comprovação (${comprovacoes.length})</h2>
    <p style="margin:0 0 12px 0;font-size:13px;color:#475569;">Demandas entregues ou faturadas há ${diasLabel(days)} ou mais e ainda ${emailKeywordHighlight("sem comprovação / nota fiscal")}.</p>
    ${buildTable(headers, rows, comprovacoes.length)}
    ${buildButton(actionUrl, actionLabel)}
  `.trim();
}

/** Resumo diário para a lista do Sebrae (SMTP → e-mails de notificação). */
export function buildPendingRemindersListEmail(params: {
  ordens: PendingOrdemCompraItem[];
  comprovacoes: PendingComprovacaoItem[];
  ordemCompraDays: number;
  comprovacaoDays: number;
  ordensCompraUrl: string;
  demandasUrl: string;
}): { subject: string; html: string; text: string } {
  const { ordens, comprovacoes } = params;
  const parts: string[] = [];
  if (ordens.length > 0) parts.push(`${ordens.length} OC(s) sem assinatura`);
  if (comprovacoes.length > 0) parts.push(`${comprovacoes.length} demanda(s) sem comprovação`);
  const resumo = parts.join(" e ");

  const innerHtml = `
    <p style="margin:0 0 20px 0;">Este é o ${emailKeywordHighlight("lembrete diário de pendências")} do NEXO Tools: ${escapeHtml(resumo)}.</p>
    ${ordensSection(ordens, params.ordensCompraUrl, params.ordemCompraDays)}
    ${comprovacoesSection(comprovacoes, params.demandasUrl, "Abrir Demandas", params.comprovacaoDays, true)}
    <p style="margin:0;font-size:12px;color:#64748b;">Os prazos e a ativação dos lembretes podem ser alterados em Integrações → Lembretes.</p>
  `.trim();

  const textLines = [
    `Lembrete diário de pendências do NEXO Tools: ${resumo}.`,
    "",
    ...ordens.map((o) => `- OC sem assinatura: ${o.demanda} (${o.agencia || "—"}) — ${diasLabel(o.dias)}`),
    ...comprovacoes.map(
      (c) => `- Sem comprovação: ${c.demanda} (${c.agencia || "—"}) — ${diasLabel(c.dias)}`
    ),
    "",
    `Ordens de compra: ${params.ordensCompraUrl}`,
    `Demandas: ${params.demandasUrl}`,
  ];

  const html = buildSystemEmailHtml({
    preheader: resumo,
    title: "Lembrete de pendências",
    innerHtml,
  });
  return { subject: `NEXO Tools — Lembrete de pendências · ${resumo}`, html, text: textLines.join("\n") };
}

/** Lembrete para os usuários de uma agência com demandas sem comprovação. */
export function buildPendingComprovacoesAgencyEmail(params: {
  agenciaNome: string;
  comprovacoes: PendingComprovacaoItem[];
  comprovacaoDays: number;
  adicionarComprovacaoUrl: string;
}): { subject: string; html: string; text: string } {
  const { agenciaNome, comprovacoes } = params;
  const innerHtml = `
    <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;">Agência: <strong>${escapeHtml(agenciaNome)}</strong></p>
    <p style="margin:0 0 20px 0;">As demandas abaixo ainda aguardam o envio da ${emailKeywordHighlight("comprovação / nota fiscal")} no NEXO Tools.</p>
    ${comprovacoesSection(comprovacoes, params.adicionarComprovacaoUrl, "Enviar comprovação", params.comprovacaoDays, false)}
    <p style="margin:0;font-size:12px;color:#64748b;">Você receberá este lembrete diariamente enquanto houver pendências.</p>
  `.trim();

  const text = [
    `Agência: ${agenciaNome}`,
    "",
    "Demandas aguardando comprovação / nota fiscal no NEXO Tools:",
    ...comprovacoes.map((c) => `- ${c.demanda} (OC/PI ${c.ocPi || "—"}) — ${diasLabel(c.dias)}`),
    "",
    `Enviar comprovação: ${params.adicionarComprovacaoUrl}`,
  ].join("\n");

  const html = buildSystemEmailHtml({
    preheader: `${comprovacoes.length} demanda(s) aguardando comprovação.`,
    title: "Comprovações pendentes",
    innerHtml,
  });
  return {
    subject: `NEXO Tools — ${comprovacoes.length} demanda(s) aguardando comprovação`,
    html,
    text,
  };
}
