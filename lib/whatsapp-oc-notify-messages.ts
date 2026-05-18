import type { Demanda, OrdemCompra } from "@/types/globals";

/** Linha divisória (compatível com WhatsApp). */
const SEP = "━━━━━━━━━━━━━━━";

/** Rodapé curto em todas as mensagens WhatsApp (itálico). */
function blocoRodapeAviso(): string {
  return `\n\n_Auto · não responder_`;
}

/** Evita quebra de *negrito* em trechos que não devem interpretar formatação como lista única. */
export function escapeWhatsAppBoldSegment(raw: string): string {
  return raw.replace(/\*/g, "·").replace(/\s+/g, " ").trim();
}

/** Texto corrido / descrição — neutraliza `*` e crases que quebrariam blocos. */
export function escapeWhatsAppDescription(raw: string): string {
  return raw.replace(/\*/g, "·").replace(/`/g, "'").trim();
}

/** Valor em _itálico_: evita `_` soltos no meio do nome. */
function escapeItalicValue(raw: string): string {
  return raw.replace(/_/g, "·").replace(/\n/g, " ").trim();
}

function italicWrap(text: string): string {
  const t = escapeItalicValue(text);
  return t ? `_${t}_` : "_—_";
}

/** Bloco monospace WhatsApp (```…```). */
function wrapMonospace(inner: string): string {
  const safe = inner.replace(/`/g, "").trim();
  return `\`\`\`${safe}\`\`\``;
}

const WHATSAPP_DESCRICAO_MAX_LENGTH = 2000;

function truncateWhatsAppDescription(raw: string): string {
  if (raw.length <= WHATSAPP_DESCRICAO_MAX_LENGTH) return raw;
  return `${raw.slice(0, WHATSAPP_DESCRICAO_MAX_LENGTH - 1)}…`;
}

/** Código SEB (campo OC/PI no cadastro); se vazio, usa id interno da demanda. */
export function sebIdOcPiFromDemanda(d: Pick<Demanda, "ocPi" | "id">): string {
  const oc = d.ocPi?.trim();
  return oc || d.id;
}

export function formatOrdemCompraOrigemAgencia(
  ordem: Pick<OrdemCompra, "autor" | "enviadoPorEmail">
): string | undefined {
  const nome = ordem.autor?.trim();
  const email = ordem.enviadoPorEmail?.trim();
  if (nome && email && nome !== email) {
    return `${nome} (${email})`;
  }
  return nome || email;
}

const WHATSAPP_DEMANDA_TEXTO_MAX = 1200;

function truncateDemandaDescricao(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const escaped = escapeWhatsAppDescription(t);
  if (escaped.length <= WHATSAPP_DEMANDA_TEXTO_MAX) return escaped;
  return `${escaped.slice(0, WHATSAPP_DEMANDA_TEXTO_MAX - 1)}…`;
}

/**
 * 📦 OC enviada — layout Nexo / Ytech (negrito, monospace no SEB-ID, itálico no rodapé).
 */
export function buildWhatsAppOcEnviadaMessage(params: {
  demanda: Demanda;
  enviadoPor: string;
}): string {
  const seb = sebIdOcPiFromDemanda(params.demanda);
  const descDemanda = truncateDemandaDescricao(params.demanda.demanda ?? "");
  const enviado = params.enviadoPor.trim() || "—";

  const parts: string[] = [
    "📦 *Nexo • Ordem de compra enviada*",
    "",
    SEP,
    `🔖 *SEB-ID:* ${wrapMonospace(seb)}`,
    "",
  ];

  if (descDemanda) {
    parts.push("📝 *Descrição da demanda*", descDemanda, "");
  }

  parts.push("🏢 *Enviado por*", italicWrap(enviado));

  return `${parts.join("\n")}${blocoRodapeAviso()}`;
}

export function buildWhatsAppOcAssinadaMessage(params: {
  demanda: Demanda;
  assinadoPor: string;
  enviadoPorAgencia?: string;
}): string {
  const seb = sebIdOcPiFromDemanda(params.demanda);
  const descDemanda = truncateDemandaDescricao(params.demanda.demanda ?? "");
  const origem = params.enviadoPorAgencia?.trim();

  const parts: string[] = [
    "📦 *Nexo • OC assinada*",
    "",
    SEP,
    `🔖 *SEB-ID:* ${wrapMonospace(seb)}`,
    "",
  ];

  if (descDemanda) {
    parts.push("📝 *Descrição da demanda*", descDemanda, "");
  }

  parts.push("✍️ *Assinado por*", italicWrap(params.assinadoPor.trim() || "—"), "");

  if (origem) {
    parts.push("🏢 *Quem abriu a OC (agência)*", italicWrap(origem));
  }

  return `${parts.join("\n")}${blocoRodapeAviso()}`;
}

/** Comprovação — mesma estrutura visual; campos: vários SEB-ID, descrição do formulário, enviado por. */
export function buildWhatsAppComprovacaoMessage(params: {
  demandas: Demanda[];
  enviadoPorUsuario: string;
  descricao?: string;
}): string {
  const codesRaw = params.demandas.map((d) =>
    escapeWhatsAppBoldSegment(sebIdOcPiFromDemanda(d))
  );
  const codeLine =
    codesRaw.length <= 6
      ? codesRaw.join(", ")
      : `${codesRaw.slice(0, 5).join(", ")} (+${codesRaw.length - 5})`;

  const descTrim = params.descricao?.trim();
  const descBody =
    descTrim && descTrim.length > 0
      ? truncateWhatsAppDescription(escapeWhatsAppDescription(descTrim))
      : null;

  const enviado = params.enviadoPorUsuario.trim() || "—";

  const parts: string[] = [
    "📦 *Nexo • Nova comprovação*",
    "",
    SEP,
    `🔖 *SEB-ID:* ${wrapMonospace(codeLine)}`,
    "",
  ];

  if (descBody) {
    parts.push("📝 *Descrição*", descBody, "");
  }

  parts.push("🏢 *Enviado por*", italicWrap(enviado));

  return `${parts.join("\n")}${blocoRodapeAviso()}`;
}

/** Certidão — sem vínculo com demanda; campos: arquivo(s), descrição, enviado por. */
export function buildWhatsAppCertidaoMessage(params: {
  nomesArquivos: string[];
  enviadoPorUsuario: string;
  descricao?: string;
}): string {
  const files = params.nomesArquivos.map((n) => escapeWhatsAppBoldSegment(n)).filter(Boolean);
  const fileLine =
    files.length === 0
      ? "—"
      : files.length <= 4
        ? files.join(", ")
        : `${files.slice(0, 3).join(", ")} (+${files.length - 3})`;

  const descTrim = params.descricao?.trim();
  const descBody =
    descTrim && descTrim.length > 0
      ? truncateWhatsAppDescription(escapeWhatsAppDescription(descTrim))
      : null;

  const enviado = params.enviadoPorUsuario.trim() || "—";

  const parts: string[] = [
    "📜 *Nexo • Nova certidão*",
    "",
    SEP,
    `📎 *Arquivo(s):* ${wrapMonospace(fileLine)}`,
    "",
  ];

  if (descBody) {
    parts.push("📝 *Descrição*", descBody, "");
  }

  parts.push("🏢 *Enviado por*", italicWrap(enviado));

  return `${parts.join("\n")}${blocoRodapeAviso()}`;
}
