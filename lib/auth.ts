import { cookies } from "next/headers";

export const COOKIE_NAME = "nexo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function createSession(email: string, name: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify({ email, name, at: Date.now() });
  cookieStore.set(COOKIE_NAME, payload, {
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

export async function getSession(): Promise<{ email: string; name: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  if (!session?.value) return null;
  try {
    const { email, name } = JSON.parse(session.value) as {
      email: string;
      name?: string;
      at: number;
    };
    return email ? { email, name: name ?? email } : null;
  } catch {
    return null;
  }
}

export function getSessionFromCookie(
  cookieHeader: string | undefined
): { email: string; name: string } | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const { email, name } = JSON.parse(decoded) as {
      email: string;
      name?: string;
      at: number;
    };
    return email ? { email, name: name ?? email } : null;
  } catch {
    return null;
  }
}
