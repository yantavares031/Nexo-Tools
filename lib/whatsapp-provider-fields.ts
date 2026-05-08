import { normalizeWhatsAppPlatformId } from "@/lib/whatsapp-platform";

function parseJsonRecord(raw: string | null | undefined): Record<string, string> {
  if (!raw?.trim()) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (o === null || typeof o !== "object" || Array.isArray(o)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export type WhatsAppProviderFieldsInput = {
  zapiInstanceId?: string;
  evolutionInstanceName?: string;
};

/** Atualiza JSON por plataforma (uma instância por vez no painel). */
export function mergeWhatsAppProviderFieldsJson(
  existingRaw: string | null | undefined,
  platform: string,
  fields: WhatsAppProviderFieldsInput
): string {
  const base = parseJsonRecord(existingRaw);
  const p = normalizeWhatsAppPlatformId(platform);
  const next: Record<string, string> = { ...base };

  if (p === "uazapi") {
    delete next.zapiInstanceId;
    delete next.evolutionInstanceName;
  } else if (p === "z-api") {
    delete next.evolutionInstanceName;
    next.zapiInstanceId = (fields.zapiInstanceId ?? "").trim();
  } else {
    delete next.zapiInstanceId;
    next.evolutionInstanceName = (fields.evolutionInstanceName ?? "").trim();
  }

  return JSON.stringify(next);
}

export function parseWhatsAppProviderFieldsJson(raw: string | null | undefined): {
  zapiInstanceId: string;
  evolutionInstanceName: string;
} {
  const r = parseJsonRecord(raw);
  return {
    zapiInstanceId: r.zapiInstanceId ?? "",
    evolutionInstanceName: r.evolutionInstanceName ?? "",
  };
}
