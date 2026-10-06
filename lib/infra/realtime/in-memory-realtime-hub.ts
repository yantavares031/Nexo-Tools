import { randomUUID } from "crypto";
import type { RealtimeEvent, RealtimeHub } from "@/lib/contracts/realtime-hub";
import type { SessionUser } from "@/lib/auth";
import type { RealtimeConnection, RealtimeNoticeTarget } from "@/types/globals";

const HEARTBEAT_MS = 25_000;
const RECONNECT_DELAY_MS = 5_000;
const PRESENCE_DEBOUNCE_MS = 500;

const encoder = new TextEncoder();

type LiveConnection = RealtimeConnection & {
  controller: ReadableStreamDefaultController<Uint8Array>;
  heartbeat: ReturnType<typeof setInterval>;
};

export type OpenStreamInput = {
  user: SessionUser;
  ip: string | null;
  userAgent: string | null;
  signal: AbortSignal;
};

function formatEvent(event: RealtimeEvent): Uint8Array {
  return encoder.encode(`event: ${event.name}\ndata: ${JSON.stringify(event.data)}\n\n`);
}

function matchesTarget(connection: RealtimeConnection, target: RealtimeNoticeTarget): boolean {
  if (target.type === "all") return true;
  if (target.type === "role") return connection.role === target.role;
  return connection.userId === target.userId;
}

/**
 * Conexões SSE em memória. Vale porque o Next roda em um único processo; com várias
 * instâncias seria preciso um pub/sub (ex.: Redis) entre elas, como no APP Eventos.
 */
class InMemoryRealtimeHub implements RealtimeHub {
  private readonly connections = new Map<string, LiveConnection>();
  private presenceTimer: ReturnType<typeof setTimeout> | null = null;

  open({ user, ip, userAgent, signal }: OpenStreamInput): ReadableStream<Uint8Array> {
    const id = randomUUID();

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        const heartbeat = setInterval(() => this.write(id, encoder.encode(": ping\n\n")), HEARTBEAT_MS);
        this.connections.set(id, {
          id,
          userId: user.userId,
          userName: user.name,
          userEmail: user.email,
          role: user.role,
          ip,
          userAgent,
          connectedAt: new Date().toISOString(),
          controller,
          heartbeat,
        });
        controller.enqueue(encoder.encode(`retry: ${RECONNECT_DELAY_MS}\n\n`));
        this.schedulePresenceChanged();
        signal.addEventListener("abort", () => this.close(id), { once: true });
      },
      cancel: () => this.close(id),
    });
  }

  listConnections(): RealtimeConnection[] {
    return [...this.connections.values()].map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      userEmail: c.userEmail,
      role: c.role,
      ip: c.ip,
      userAgent: c.userAgent,
      connectedAt: c.connectedAt,
    }));
  }

  send(target: RealtimeNoticeTarget, event: RealtimeEvent): number {
    const payload = formatEvent(event);
    let delivered = 0;
    for (const connection of [...this.connections.values()]) {
      if (matchesTarget(connection, target) && this.write(connection.id, payload)) delivered += 1;
    }
    return delivered;
  }

  closeUserConnections(userId: string): number {
    const ids = [...this.connections.values()].filter((c) => c.userId === userId).map((c) => c.id);
    for (const id of ids) this.close(id);
    return ids.length;
  }

  private write(id: string, chunk: Uint8Array): boolean {
    const connection = this.connections.get(id);
    if (!connection) return false;
    try {
      connection.controller.enqueue(chunk);
      return true;
    } catch {
      this.close(id);
      return false;
    }
  }

  private close(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;
    this.connections.delete(id);
    clearInterval(connection.heartbeat);
    try {
      connection.controller.close();
    } catch {
      // stream já encerrado pelo cliente
    }
    this.schedulePresenceChanged();
  }

  private schedulePresenceChanged(): void {
    if (this.presenceTimer) clearTimeout(this.presenceTimer);
    this.presenceTimer = setTimeout(() => {
      this.presenceTimer = null;
      this.send({ type: "role", role: "admin" }, { name: "presence.changed", data: { connections: this.connections.size } });
    }, PRESENCE_DEBOUNCE_MS);
  }
}

const globalHub = globalThis as typeof globalThis & { __nexoRealtimeHub?: InMemoryRealtimeHub };

/** Singleton no `globalThis`: route handler e Server Actions podem cair em bundles diferentes. */
export function getRealtimeHub(): InMemoryRealtimeHub {
  return (globalHub.__nexoRealtimeHub ??= new InMemoryRealtimeHub());
}
