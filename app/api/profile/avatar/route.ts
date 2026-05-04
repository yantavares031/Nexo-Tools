import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserRepository } from "@/lib/repositories";
import { getAppObjectBufferFromR2, isR2AppObjectKey } from "@/lib/r2-upload";

function mimeFromKey(key: string): string {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/** Foto de perfil do usuário logado (lê do R2). Autenticado apenas via sessão. */
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return new NextResponse(null, { status: 401 });
  }

  const user = await getUserRepository().findById(session.userId);
  const key = user?.avatarKey;
  if (!key || !isR2AppObjectKey(key)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buf = await getAppObjectBufferFromR2(key);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeFromKey(key),
        // Conteúdo por usuário — não cachear agressivamente ou a troca de foto parece “não funcionar”.
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
