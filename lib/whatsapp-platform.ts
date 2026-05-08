/** Valores persistidos em `whatsapp_integration.platform`. */
export const WHATSAPP_PLATFORMS = ["uazapi", "z-api", "evolution"] as const;

export type WhatsAppPlatformChoice = (typeof WHATSAPP_PLATFORMS)[number];

export function normalizeWhatsAppPlatformId(raw: string): WhatsAppPlatformChoice {
  const p = raw.trim().toLowerCase();
  if (p === "z-api") return "z-api";
  if (p === "evolution") return "evolution";
  return "uazapi";
}

export function isWhatsAppUazapiPlatform(platform: string): boolean {
  return normalizeWhatsAppPlatformId(platform) === "uazapi";
}
