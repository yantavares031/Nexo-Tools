import { getSession } from "@/lib/auth";
import { getRealtimeHub } from "@/lib/infra/realtime/in-memory-realtime-hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Canal SSE do painel: avisos do admin e encerramento de sessão. EventSource exige um endpoint HTTP. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) return new Response(null, { status: 401 });

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const stream = getRealtimeHub().open({
    user: session,
    ip: forwardedFor || request.headers.get("x-real-ip")?.trim() || null,
    userAgent: request.headers.get("user-agent")?.slice(0, 300) || null,
    signal: request.signal,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform impede a compressão do Next de segurar os eventos em buffer.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
