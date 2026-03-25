import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "./lib/auth";
import type { UserRole } from "./types/globals";

type ParsedSession = {
  email: string;
  name: string;
  role: UserRole;
  agenciaId?: string;
  mustChangePassword: boolean;
};

function parseSession(cookieValue: string | undefined): ParsedSession | null {
  if (!cookieValue) return null;
  try {
    const decoded = decodeURIComponent(cookieValue);
    const { email, name, role, agenciaId, mustChangePassword } = JSON.parse(decoded) as {
      email?: string;
      name?: string;
      role?: UserRole;
      agenciaId?: string;
      mustChangePassword?: boolean;
    };
    if (!email) return null;
    return {
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = parseSession(cookie);

  if (pathname.startsWith("/login")) {
    if (session) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/primeiro-acesso", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/primeiro-acesso")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!session.mustChangePassword) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.mustChangePassword) {
    return NextResponse.redirect(new URL("/primeiro-acesso", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
