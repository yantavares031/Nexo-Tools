import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { UazapiWhatsAppProvider } from "@/lib/infra/whatsapp/uazapi-whatsapp-provider";

/**
 * Escolhe o adaptador da API WhatsApp conforme o identificador persistido.
 * Padrão: **uazapi**.
 */
export function getWhatsAppProvider(platform: string): IWhatsAppProvider {
  const p = platform.trim().toLowerCase();
  if (p === "uazapi" || p === "") {
    return new UazapiWhatsAppProvider();
  }
  throw new Error(
    `Plataforma WhatsApp não suportada: "${platform}". Altere para "uazapi" ou implemente o adaptador correspondente.`
  );
}
