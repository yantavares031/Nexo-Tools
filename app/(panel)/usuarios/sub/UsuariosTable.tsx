"use client";

import { useState } from "react";
import { UserAvatarThumb } from "@/components/UserAvatarThumb";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { VerDetalhesUsuarioModal } from "@/modals/VerDetalhesUsuarioModal";
import type { Agencia, UserPublic, UserRole } from "@/types/globals";
import { ROLE_LABELS } from "./user-roles";

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  admin: "dark",
  operator: "neutral",
  agency: "info",
};

function getAgenciaName(agencias: Agencia[], agenciaId?: string): string | undefined {
  if (!agenciaId) return undefined;
  return agencias.find((agencia) => agencia.id === agenciaId)?.nomeFantasia ?? agenciaId;
}

interface UsuariosTableProps {
  users: UserPublic[];
  agencias: Agencia[];
  emptyMessage?: string;
}

export function UsuariosTable({ users, agencias, emptyMessage }: UsuariosTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openDetails(user: UserPublic) {
    setSelectedUser(user);
    setModalOpen(true);
  }

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Usuário</TableHeaderCell>
            <TableHeaderCell className="w-28">Perfil</TableHeaderCell>
            <TableHeaderCell>Agência</TableHeaderCell>
            <TableHeaderCell className="w-28">Acesso</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-neutral-500">
                {emptyMessage ?? "Nenhum usuário cadastrado."}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const displayName = user.name?.trim() || user.email;
              const agenciaName = user.role === "agency" ? getAgenciaName(agencias, user.agenciaId) : undefined;
              const hasAccess = user.acesso !== false;
              return (
                <TableRow
                  key={user.id}
                  className="relative cursor-pointer transition-colors hover:bg-sky-50/60 has-[button:focus-visible]:bg-sky-50/60"
                >
                  <TableCell className="max-w-80" title={`${displayName} — ${user.email}`}>
                    <div className="flex items-center gap-2.5">
                      <UserAvatarThumb userId={user.id} label={displayName} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-950">
                          <button
                            type="button"
                            onClick={() => openDetails(user)}
                            className="text-left outline-none after:absolute after:inset-0 after:content-['']"
                          >
                            {user.name?.trim() || "—"}
                          </button>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={ROLE_TONES[user.role] ?? "neutral"}>{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={agenciaName}>
                    {agenciaName ? <span className="text-link">{agenciaName}</span> : "—"}
                  </TableCell>
                  <TableCell>
                    {hasAccess ? <Badge tone="success">Liberado</Badge> : <Badge tone="danger">Bloqueado</Badge>}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <VerDetalhesUsuarioModal
        user={selectedUser}
        agencias={agencias}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </>
  );
}
