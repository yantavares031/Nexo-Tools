import { cookies } from "next/headers";
import type { User, UserRole } from "@/types/globals";

export const COOKIE_NAME = "nexo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

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
  cookieStore.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;
  try {
    const { userId, email, name, role, agenciaId, mustChangePassword, avatarKey } = JSON.parse(
      session.value
    ) as SessionPayload & { userId?: string; mustChangePassword?: boolean; avatarKey?: string | null };
    if (!email) return null;
    return {
      userId: userId ?? "",
      email,
      name: name ?? email,
      role: role ?? "operator",
      agenciaId,
      mustChangePassword: Boolean(mustChangePassword),
      avatarKey: avatarKey ?? undefined,
    };
  } catch {
    return null;
  }
}

export function getSessionFromCookie(
  cookieHeader: string | undefined
): SessionUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const { userId, email, name, role, agenciaId, mustChangePassword, avatarKey } = JSON.parse(
      decoded
    ) as SessionPayload & { userId?: string; mustChangePassword?: boolean; avatarKey?: string | null };
    if (!email) return null;
    return {
      userId: userId ?? "",
      email,
      name: name ?? email,
      role: role ?? "operator",
      agenciaId,
      mustChangePassword: Boolean(mustChangePassword),
      avatarKey: avatarKey ?? undefined,
    };
  } catch {
    return null;
  }
}
