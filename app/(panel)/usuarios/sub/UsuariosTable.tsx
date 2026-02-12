"use client";

import { useState } from "react";
import type { User } from "@/types/globals";
import type { Agencia } from "@/types/globals";
import { VerDetalhesUsuarioModal } from "@/modals/VerDetalhesUsuarioModal";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  agency: "Agência",
};

function getAgenciaName(agencias: Agencia[], agenciaId?: string): string {
  if (!agenciaId) return "—";
  const a = agencias.find((ag) => ag.id === agenciaId);
  return a?.nomeFantasia ?? agenciaId;
}

interface UsuariosTableProps {
  users: User[];
  agencias: Agencia[];
  emptyMessage?: string;
}

export function UsuariosTable({
  users,
  agencias,
  emptyMessage,
}: UsuariosTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleRowClick(u: User) {
    setSelectedUser(u);
    setModalOpen(true);
  }

  if (users.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        {emptyMessage ?? "Nenhum usuário cadastrado."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-600">Nome</th>
              <th className="px-4 py-3 font-semibold text-slate-600">E-mail</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Perfil</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Agência</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => handleRowClick(u)}
                className="cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(u);
                  }
                }}
              >
                <td className="px-4 py-3 text-slate-800">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">
                  {ROLE_LABELS[u.role] ?? u.role}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.role === "agency"
                    ? getAgenciaName(agencias, u.agenciaId)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
