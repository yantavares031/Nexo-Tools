import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APP_CONFIG } from "@/config/app";
import { COOKIE_NAME, readSessionValue } from "./lib/session-cookie";
import type { UserRole } from "./types/globals";

type ParsedSession = {
  email: string;
  name: string;
  role: UserRole;
  agenciaId?: string;
  mustChangePassword: boolean;
};

function parseSession(cookieValue: string | undefined): ParsedSession | null {
  const payload = readSessionValue(cookieValue) as Partial<ParsedSession> | null;
  if (!payload?.email) return null;
  return {
    email: payload.email,
    name: payload.name ?? payload.email,
    role: payload.role ?? "operator",
    agenciaId: payload.agenciaId,
    mustChangePassword: Boolean(payload.mustChangePassword),
  };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = parseSession(cookie);

  // Recuperação de senha funciona com ou sem sessão (o link chega por e-mail).
  if (pathname.startsWith("/login/esqueci-senha") || pathname.startsWith("/login/redefinir-senha")) {
    return NextResponse.next();
  }

  if (pathname === "/login" && request.nextUrl.searchParams.get("session") === "ended") {
    const response = NextResponse.next();
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (pathname.startsWith("/login")) {
    if (session) {
      if (session.mustChangePassword) {
        return NextResponse.redirect(new URL("/primeiro-acesso", request.url));
      }
      return NextResponse.redirect(new URL(APP_CONFIG.homeHref, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/primeiro-acesso")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!session.mustChangePassword) {
      return NextResponse.redirect(new URL(APP_CONFIG.homeHref, request.url));
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|lottie/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
