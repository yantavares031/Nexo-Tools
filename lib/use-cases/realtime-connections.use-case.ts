import type { RealtimeHub } from "@/lib/contracts/realtime-hub";
import type { ISessionRevocationRepository } from "@/lib/domain/session-revocation.repository";
import type { RealtimeConnection, RealtimeNotice, RealtimeNoticeTarget } from "@/types/globals";

export type RealtimeOnlineUser = Pick<RealtimeConnection, "userId" | "userName" | "userEmail" | "role"> & {
  tabs: number;
};

export type RealtimeConnectionsPanel = {
  connections: RealtimeConnection[];
  onlineUsers: RealtimeOnlineUser[];
};

export function getRealtimeConnectionsUseCase(deps: { hub: RealtimeHub }): RealtimeConnectionsPanel {
  const connections = deps.hub
    .listConnections()
    .sort((a, b) => a.userName.localeCompare(b.userName, "pt-BR") || a.connectedAt.localeCompare(b.connectedAt));

  const byUser = new Map<string, RealtimeOnlineUser>();
  for (const { userId, userName, userEmail, role } of connections) {
    const current = byUser.get(userId);
    if (current) current.tabs += 1;
    else byUser.set(userId, { userId, userName, userEmail, role, tabs: 1 });
  }

  return { connections, onlineUsers: [...byUser.values()] };
}

/**
 * Invalida todas as sessões do usuário (inclusive as que estão sem aba aberta)
 * e manda as abas conectadas para o login na hora.
 */
export async function disconnectUserUseCase(
  input: { userId: string; actorUserId: string },
  deps: { hub: RealtimeHub; sessionRevocations: ISessionRevocationRepository }
): Promise<{ closedTabs: number }> {
  if (input.userId === input.actorUserId) {
    throw new Error("Você não pode desconectar a sua própria sessão.");
  }

  await deps.sessionRevocations.revoke(input.userId, Date.now());
  deps.hub.send({ type: "user", userId: input.userId }, { name: "session.terminated", data: {} });
  return { closedTabs: deps.hub.closeUserConnections(input.userId) };
}

export function sendRealtimeNoticeUseCase(
  input: { target: RealtimeNoticeTarget; notice: RealtimeNotice },
  deps: { hub: RealtimeHub }
): { delivered: number } {
  const delivered = deps.hub.send(input.target, { name: "notice", data: input.notice });
  if (delivered === 0) {
    throw new Error("Nenhum usuário online para esse destino.");
  }
  return { delivered };
}
