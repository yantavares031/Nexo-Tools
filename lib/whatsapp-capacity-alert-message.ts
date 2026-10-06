import { currencyFormat } from "@/lib/format";
import { escapeWhatsAppBoldSegment } from "@/lib/whatsapp-oc-notify-messages";

const SEP = "━━━━━━━━━━━━━━━";

const percentFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function buildWhatsAppCapacityAlertMessage(params: {
  agenciaNome: string;
  threshold: number;
  percentual: number;
  faturado: number;
  capacidadeAnual: number;
}): string {
  const saldo = params.capacidadeAnual - params.faturado;
  const titulo = params.threshold >= 100 ? "🚨 *Capacidade anual atingida*" : "⚠️ *Alerta de capacidade*";
  return [
    titulo,
    SEP,
    `*Agência:* ${escapeWhatsAppBoldSegment(params.agenciaNome)}`,
    `*Uso:* ${percentFormat.format(params.percentual)}% (limite de ${params.threshold}%)`,
    `*Faturado:* ${currencyFormat.format(params.faturado)}`,
    `*Capacidade anual:* ${currencyFormat.format(params.capacidadeAnual)}`,
    saldo >= 0
      ? `*Saldo:* ${currencyFormat.format(saldo)}`
      : `*Excedente:* ${currencyFormat.format(-saldo)}`,
    SEP,
    "_Auto · não responder_",
  ].join("\n");
}
