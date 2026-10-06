import { RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSection } from "@/components/ui/form-section";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { ROLE_LABELS } from "@/lib/roles";
import type { RealtimeConnection } from "@/types/globals";
import { DisconnectUserButton } from "./DisconnectUserButton";
import { describeUserAgent } from "./user-agent";

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

type Props = {
  connections: RealtimeConnection[];
  currentUserId: string;
};

export function ConnectionsTable({ connections, currentUserId }: Props) {
  return (
    <FormSection
      icon={<RadioTower aria-hidden />}
      title={`Abas conectadas (${connections.length})`}
      description="Cada aba aberta do painel é uma conexão. Desconectar encerra todas as sessões do usuário."
    >
      {connections.length === 0 ? (
        <EmptyState icon={<RadioTower aria-hidden />} title="Ninguém conectado agora" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Usuário</TableHeaderCell>
              <TableHeaderCell>Perfil</TableHeaderCell>
              <TableHeaderCell>Conectado desde</TableHeaderCell>
              <TableHeaderCell>Navegador</TableHeaderCell>
              <TableHeaderCell>IP</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Ações</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {connections.map((connection) => {
              const isSelf = connection.userId === currentUserId;
              return (
                <TableRow key={connection.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-lime-500" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-950">
                          {connection.userName}
                          {isSelf && <span className="ml-1.5 text-xs font-normal text-neutral-400">(você)</span>}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{connection.userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={connection.role === "admin" ? "dark" : "neutral"}>{ROLE_LABELS[connection.role]}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {timeFormat.format(new Date(connection.connectedAt))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{describeUserAgent(connection.userAgent)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{connection.ip ?? "—"}</TableCell>
                  <TableCell className="w-12">
                    {!isSelf && <DisconnectUserButton userId={connection.userId} userName={connection.userName} />}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </FormSection>
  );
}
