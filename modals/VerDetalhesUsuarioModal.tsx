"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useFormStatus } from "react-dom";
import { X, Check, CircleMinus, Users } from "lucide-react";
import { updateUserAction, removeUserAction } from "@/app/actions/user";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { useConfirm } from "@/lib/confirm-context";
import type { User } from "@/types/globals";
import type { Agencia } from "@/types/globals";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  agency: "Agência",
};

interface VerDetalhesUsuarioModalProps {
  user: User | null;
  agencias: Agencia[];
  open: boolean;
  onClose: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Salvando...
        </>
      ) : (
        <>
          <Check className="size-3.5 stroke-[2.5]" />
          Salvar
        </>
      )}
    </button>
  );
}

type EditField = string | null;

export function VerDetalhesUsuarioModal({
  user,
  agencias,
  open,
  onClose,
}: VerDetalhesUsuarioModalProps) {
  const [isPendingRemove, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const [state, formAction] = useActionState(
    updateUserAction.bind(null, user?.id ?? ""),
    null
  );
  useToastOnActionError(state);

  const [editingField, setEditingField] = useState<EditField>(null);
  const [values, setValues] = useState<{
    name: string;
    email: string;
    password: string;
    role: User["role"];
    agenciaId: string;
  }>({
    name: "",
    email: "",
    password: "",
    role: "operator",
    agenciaId: "",
  });

  useEffect(() => {
    if (user) {
      setValues({
        name: user.name ?? "",
        email: user.email,
        password: "",
        role: user.role,
        agenciaId: user.agenciaId ?? "",
      });
    }
  }, [user]);

  useEscapeKey(onClose, open && !isPendingRemove);

  async function handleRemover() {
    if (!user) return;
    const ok = await confirm({
      title: "Remover usuário",
      message: "Deseja realmente remover este usuário?",
      confirmLabel: "Remover",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(() => {
      removeUserAction(user.id);
    });
  }

  if (!open || !user) return null;

  const textClass =
    "cursor-pointer rounded px-2 py-1 text-sm text-slate-800 hover:bg-slate-50";
  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400";

  const roleBadgeClass =
    values.role === "admin"
      ? "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
      : values.role === "agency"
        ? "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
        : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800";

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] min-w-full items-center justify-center p-4">
      <div
        className="absolute inset-0 min-h-[100dvh] min-w-full bg-black/40"
        onClick={isPendingRemove ? () => {} : onClose}
        aria-hidden
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-labelledby="modal-detalhes-usuario-title"
        aria-modal
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-3">
          <h2
            id="modal-detalhes-usuario-title"
            className="flex items-center gap-2 text-lg font-semibold text-slate-800"
          >
            <Users className="size-5 shrink-0" />
            Detalhes do usuário
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPendingRemove}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          action={formAction}
          className="flex max-h-[70vh] flex-1 flex-col overflow-hidden"
        >
          <div className="overflow-y-auto p-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Nome
                  </span>
                  {editingField === "name" ? (
                    <input
                      name="name"
                      value={values.name}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, name: e.target.value }))
                      }
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                      placeholder="Nome"
                    />
                  ) : (
                    <>
                      <input type="hidden" name="name" value={values.name} />
                      <div
                        onClick={() => setEditingField("name")}
                        className={textClass}
                      >
                        {values.name || "—"}
                      </div>
                    </>
                  )}
                </div>
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    E-mail *
                  </span>
                  {editingField === "email" ? (
                    <input
                      name="email"
                      type="email"
                      required
                      value={values.email}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, email: e.target.value }))
                      }
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                    />
                  ) : (
                    <>
                      <input type="hidden" name="email" value={values.email} />
                      <div
                        onClick={() => setEditingField("email")}
                        className={textClass}
                      >
                        {values.email}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="group">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Senha (deixe em branco para manter)
                </span>
                {editingField === "password" ? (
                  <input
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, password: e.target.value }))
                    }
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    className={inputClass}
                    placeholder="Nova senha"
                  />
                  ) : (
                    <>
                      <input type="hidden" name="password" value="" />
                      <div
                        onClick={() => setEditingField("password")}
                        className={textClass}
                      >
                        {values.password ? "••••••••" : "—"}
                      </div>
                    </>
                  )}
                </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Perfil
                  </span>
                  {editingField === "role" ? (
                    <select
                      name="role"
                      value={values.role}
                      onChange={(e) => {
                        const newRole = e.target.value as User["role"];
                        setValues((v) => ({
                          ...v,
                          role: newRole,
                          agenciaId: newRole === "agency" ? v.agenciaId : "",
                        }));
                      }}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className={inputClass}
                    >
                      <option value="operator">Operador</option>
                      <option value="admin">Admin</option>
                      <option value="agency">Agência</option>
                    </select>
                  ) : (
                    <>
                      <input type="hidden" name="role" value={values.role} />
                      <div
                        onClick={() => setEditingField("role")}
                        className={`cursor-pointer rounded px-2 py-1 hover:bg-slate-50 ${roleBadgeClass}`}
                      >
                        {ROLE_LABELS[values.role] ?? values.role}
                      </div>
                    </>
                  )}
                </div>
                {values.role === "agency" && (
                  <div className="group">
                    <span className="mb-1 block text-xs font-medium text-slate-500">
                      Agência
                    </span>
                    {editingField === "agenciaId" ? (
                      <select
                        name="agenciaId"
                        value={values.agenciaId}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, agenciaId: e.target.value }))
                        }
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className={inputClass}
                      >
                        <option value="">Selecione</option>
                        {agencias.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nomeFantasia}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="hidden"
                          name="agenciaId"
                          value={values.agenciaId}
                        />
                        <div
                          onClick={() => setEditingField("agenciaId")}
                          className={
                            values.agenciaId
                              ? "cursor-pointer inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                              : textClass
                          }
                        >
                          {values.agenciaId
                            ? agencias.find((a) => a.id === values.agenciaId)
                                ?.nomeFantasia ?? values.agenciaId
                            : "—"}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {values.role !== "agency" && (
                  <input type="hidden" name="agenciaId" value="" />
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-3">
            <SubmitButton />
            <button
              type="button"
              onClick={handleRemover}
              disabled={isPendingRemove}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPendingRemove ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  Removendo...
                </>
              ) : (
                <>
                  <CircleMinus className="size-3.5 stroke-[2.5]" />
                  Remover
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
