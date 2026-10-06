import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "nexo_session";

/**
 * Destino quando o cookie existe mas a sessão não vale mais (ex.: desconectada pelo admin).
 * O proxy apaga o cookie nesse caminho; sem isso, `/login` devolveria para o painel em loop.
 */
export const SESSION_ENDED_LOGIN_PATH = "/login?session=ended";

const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = "nexo-dev-only-session-secret-do-not-use-in-prod";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= MIN_SECRET_LENGTH) return secret;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_SECRET;
  throw new Error(`SESSION_SECRET não configurado (mínimo ${MIN_SECRET_LENGTH} caracteres).`);
}

function sign(encoded: string): string {
  return createHmac("sha256", sessionSecret()).update(encoded).digest("base64url");
}

/** Valor do cookie: `base64url(json).assinatura`. Sem a chave do servidor não dá para alterar o conteúdo. */
export function signSessionValue(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Devolve o JSON do cookie só se a assinatura conferir; cookie antigo (JSON puro) ou adulterado vira `null`. */
export function readSessionValue(cookieValue: string | undefined): Record<string, unknown> | null {
  if (!cookieValue) return null;
  const [encoded, signature, ...rest] = cookieValue.split(".");
  if (!encoded || !signature || rest.length > 0) return null;
  try {
    const expected = Buffer.from(sign(encoded));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
