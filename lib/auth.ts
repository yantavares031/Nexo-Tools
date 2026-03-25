import { cookies } from "next/headers";
import type { UserRole } from "@/types/globals";

export const COOKIE_NAME = "nexo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  agenciaId?: string;
  mustChangePassword: boolean;
};

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
    const { userId, email, name, role, agenciaId, mustChangePassword } = JSON.parse(
      session.value
    ) as SessionPayload & { userId?: string; mustChangePassword?: boolean };
    if (!email) return null;
    return {
      userId: userId ?? "",
      email,
      name: name ?? email,
      role: role ?? "operator",
      agenciaId,
      mustChangePassword: Boolean(mustChangePassword),
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
    const { userId, email, name, role, agenciaId, mustChangePassword } = JSON.parse(
      decoded
    ) as SessionPayload & { userId?: string; mustChangePassword?: boolean };
    if (!email) return null;
    return {
      userId: userId ?? "",
      email,
      name: name ?? email,
      role: role ?? "operator",
      agenciaId,
      mustChangePassword: Boolean(mustChangePassword),
    };
  } catch {
    return null;
  }
}
