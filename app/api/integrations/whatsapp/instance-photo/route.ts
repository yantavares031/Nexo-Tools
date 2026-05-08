import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getWhatsAppIntegrationRepository } from "@/lib/repositories";
import { getAppObjectBufferFromR2 } from "@/lib/r2-upload";

/** Foto da instância WhatsApp salva no R2 (admin). */
export async function GET() {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return new NextResponse(null, { status: 401 });
  }

  const repo = getWhatsAppIntegrationRepository();
  const cfg = await repo.get();
  const key = cfg?.profilePicStorageKey?.trim();
  if (!key) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buf = await getAppObjectBufferFromR2(key);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=120",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
