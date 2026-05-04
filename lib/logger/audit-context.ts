import type { SessionUser } from "@/lib/auth";

/**
 * IP do cliente a partir dos headers (proxy / edge).
 * Só em contexto de requisição Next (Server Action, RSC, route).
 */
export async function getClientIp(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const xf = h.get("x-forwarded-for");
    const first = xf?.split(",")[0]?.trim();
    if (first) return first;
    return h.get("x-real-ip")?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function sessionUserToAuditFields(session: SessionUser): Record<string, unknown> {
  return {
    userId: session.userId,
    username: session.name?.trim() || session.email,
    email: session.email,
    role: session.role,
    ...(session.agenciaId ? { agenciaId: session.agenciaId } : {}),
  };
}

/**
 * Campos padronizados para auditoria nos logs Pino (alinhado à UI admin):
 * userId, username, email, role, agenciaId (opcional), ip (opcional).
 */
export async function getAuditLogFields(): Promise<Record<string, unknown>> {
  const ip = await getClientIp();
  try {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (!session?.email) {
      return ip ? { ip } : {};
    }
    return {
      ...sessionUserToAuditFields(session),
      ...(ip ? { ip } : {}),
    };
  } catch {
    return ip ? { ip } : {};
  }
}
