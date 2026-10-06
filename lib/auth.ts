import { cookies } from "next/headers";
import type { User, UserRole } from "@/types/globals";
import { getCachedSessionRevocationRepository } from "@/lib/infra/cached-session-revocation.repository";
import { COOKIE_NAME, readSessionValue, signSessionValue } from "@/lib/session-cookie";

export { COOKIE_NAME };

const SECONDS_PER_DAY = 60 * 60 * 24;
/** Padrão: 30 dias (cookie de sessão, não JWT). */
const DEFAULT_SESSION_MAX_AGE_SECONDS = SECONDS_PER_DAY * 30;
const MAX_SESSION_MAX_AGE_SECONDS = SECONDS_PER_DAY * 365;

function sessionCookieMaxAgeSeconds(): number {
  const raw = process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number.parseInt(String(raw).trim(), 10);
    if (Number.isFinite(n) && n > 0) {
      return Math.min(n, MAX_SESSION_MAX_AGE_SECONDS);
    }
  }
  return DEFAULT_SESSION_MAX_AGE_SECONDS;
}

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  agenciaId?: string;
  mustChangePassword: boolean;
  /** Chave R2 em `avatars/…` para exibir foto no painel. */
  avatarKey?: string | null;
};

/** Monta o cookie de sessão a partir do registro no banco (após login ou atualização de perfil). */
export function sessionUserFromDbUser(user: User): SessionUser {
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
    agenciaId: user.agenciaId,
    mustChangePassword: Boolean(
      user.temporaryPassword != null && String(user.temporaryPassword).length > 0
    ),
    avatarKey: user.avatarKey ?? undefined,
  };
}

type SessionPayload = SessionUser & { at: number };

export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const payload: SessionPayload = { ...user, at: Date.now() };
  cookieStore.set(COOKIE_NAME, signSessionValue(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionCookieMaxAgeSeconds(),
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

async function isSessionRevoked(userId: string, issuedAt: number | undefined): Promise<boolean> {
  const revokedAt = await getCachedSessionRevocationRepository().getRevokedAt(userId);
  return revokedAt != null && (issuedAt ?? 0) <= revokedAt;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const payload = readSessionValue(cookieStore.get(COOKIE_NAME)?.value) as
    | (Partial<SessionPayload> & { avatarKey?: string | null })
    | null;
  if (!payload?.email) return null;
  const { userId, email, name, role, agenciaId, mustChangePassword, avatarKey, at } = payload;
  if (userId && (await isSessionRevoked(userId, at))) return null;
  return {
    userId: userId ?? "",
    email,
    name: name ?? email,
    role: role ?? "operator",
    agenciaId,
    mustChangePassword: Boolean(mustChangePassword),
    avatarKey: avatarKey ?? undefined,
  };
}
