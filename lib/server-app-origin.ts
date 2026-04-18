import { headers } from "next/headers";
import { getPublicAppBaseUrlForEmail } from "@/lib/public-app-url";

/**
 * Origem pública do app a partir da requisição (links, etc.).
 * Sem `Host` na requisição, usa a mesma ordem de variáveis que e-mails: {@link getPublicAppBaseUrlForEmail}.
 */
export async function getServerAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const rawProto = h.get("x-forwarded-proto");
  const proto = rawProto?.split(",")[0]?.trim() || (host?.includes("localhost") ? "http" : "https");
  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  return getPublicAppBaseUrlForEmail();
}
