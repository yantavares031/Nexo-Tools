import type { RealtimeConnection, RealtimeNotice, RealtimeNoticeTarget } from "@/types/globals";

export type RealtimeEvent =
  | { name: "notice"; data: RealtimeNotice }
  | { name: "session.terminated"; data: Record<string, never> }
  | { name: "presence.changed"; data: { connections: number } };

export interface RealtimeHub {
  listConnections(): RealtimeConnection[];
  /** Devolve quantas abas receberam o evento. */
  send(target: RealtimeNoticeTarget, event: RealtimeEvent): number;
  /** Fecha todas as abas abertas do usuário; devolve quantas foram fechadas. */
  closeUserConnections(userId: string): number;
}
