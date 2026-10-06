import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth";
import { getRealtimeHub } from "@/lib/infra/realtime/in-memory-realtime-hub";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/session-cookie";
import { getRealtimeConnectionsUseCase } from "@/lib/use-cases/realtime-connections.use-case";
import { ConnectionsTable } from "./sub/ConnectionsTable";
import { PresenceAutoRefresh } from "./sub/PresenceAutoRefresh";
import { SendNoticeForm } from "./sub/SendNoticeForm";

export const dynamic = "force-dynamic";

export default async function AdminConexoesPage() {
  const session = await getSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "admin") redirect("/");

  const { connections, onlineUsers } = getRealtimeConnectionsUseCase({ hub: getRealtimeHub() });

  return (
    <div className="w-full">
      <div className="space-y-8">
        <PresenceAutoRefresh />
        <PageHeader
          title="Conexões ativas"
          badges={
            <Badge tone={onlineUsers.length > 0 ? "success" : "muted"}>
              {onlineUsers.length} {onlineUsers.length === 1 ? "usuário online" : "usuários online"}
            </Badge>
          }
          description="Quem está com o painel aberto agora. A lista atualiza sozinha quando alguém entra ou sai."
        />
        <SendNoticeForm onlineUsers={onlineUsers} />
        <ConnectionsTable connections={connections} currentUserId={session.userId} />
      </div>
    </div>
  );
}
