import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserRepository } from "@/lib/repositories";
import { getAppObjectBufferFromR2, isR2AppObjectKey } from "@/lib/r2-upload";
import { parseUserRecordId } from "@/lib/validation/schemas/common";

function mimeFromKey(key: string): string {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/** Foto de perfil de outro usuário (painel autenticado). Lê o avatar no R2 pelo usuário informado. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return new NextResponse(null, { status: 401 });
  }

  const { userId } = await params;
  const idCheck = parseUserRecordId(userId);
  if (!idCheck.ok) {
    return new NextResponse(null, { status: 404 });
  }

  const user = await getUserRepository().findById(idCheck.id);
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
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
