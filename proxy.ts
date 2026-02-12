import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "./lib/auth";
import type { UserRole } from "./types/globals";

const PUBLIC_PATHS = ["/login"];

function parseSession(
  cookieValue: string | undefined
): { role: UserRole; agenciaId?: string } | null {
  if (!cookieValue) return null;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const { email, role, agenciaId } = JSON.parse(decoded) as {
      email?: string;
      role?: UserRole;
      agenciaId?: string;
    };
    if (!email) return null;
    return { role: role ?? "operator", agenciaId };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = parseSession(cookie);

  // Rotas públicas: se já logado, redireciona para /
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Não logado: redireciona para login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Permissão por role é verificada em cada página (antes de carregar dados)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
