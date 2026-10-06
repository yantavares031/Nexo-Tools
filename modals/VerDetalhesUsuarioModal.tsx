"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import { Check, CircleMinus, Users } from "lucide-react";
import { updateUserAction, removeUserAction } from "@/app/actions/user";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { useConfirm } from "@/components/confirm-provider";
import { Modal } from "@/components/Modal";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { UserPublic } from "@/types/globals";
type UserRole = UserPublic["role"];
import type { Agencia } from "@/types/globals";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  agency: "Agência",
};

interface VerDetalhesUsuarioModalProps {
  user: UserPublic | null;
  agencias: Agencia[];
  open: boolean;
  onClose: () => void;
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
  const [state, formAction, isPendingSave] = useActionState(
    updateUserAction.bind(null, user?.id ?? ""),
    null
  );
  useToastOnActionError(state);

  const [editingField, setEditingField] = useState<EditField>(null);
  const [values, setValues] = useState<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    agenciaId: string;
    acesso: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    role: "operator",
    agenciaId: "",
    acesso: true,
  });

  useEffect(() => {
    if (user) {
      setValues({
        name: user.name ?? "",
        email: user.email,
        password: "",
        role: user.role,
        agenciaId: user.agenciaId ?? "",
        acesso: user.acesso !== false,
      });
    }
  }, [user]);

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
    "-mx-2 cursor-pointer rounded-field px-2 py-1.5 text-sm text-neutral-800 transition-colors hover:bg-neutral-50";
  const inputClass = cn("block w-full", inputClassName);
  const fieldLabelClass = "mb-1 block text-[11px] font-medium tracking-wide text-neutral-400 uppercase";

  const roleBadgeTone: BadgeTone =
    values.role === "admin" ? "info" : values.role === "agency" ? "neutral" : "success";

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="2xl"
      ariaLabelledby="modal-detalhes-usuario-title"
      escapeEnabled={!isPendingRemove && !isPendingSave}
      closeOnOverlayClick={!isPendingRemove && !isPendingSave}
      innerClassName="flex max-h-[90vh] flex-col overflow-hidden"
    >
      <Modal.Header onClose={onClose} closeDisabled={isPendingRemove || isPendingSave}>
        <h2
          id="modal-detalhes-usuario-title"
          className="flex items-center gap-2 text-lg font-semibold text-neutral-950"
        >
          <Users className="size-5 shrink-0" />
          Detalhes do usuário
        </h2>
      </Modal.Header>
      <form
        action={formAction}
        className="flex max-h-[70vh] flex-1 flex-col overflow-hidden"
      >
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="group">
                <span className={fieldLabelClass}>
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
                <span className={fieldLabelClass}>
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
              <span className={fieldLabelClass}>
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
                  {/* Precisa espelhar values.password: ao sair do campo (blur), só existe este hidden no DOM — "" apagava a senha no submit. */}
                  <input type="hidden" name="password" value={values.password} />
                  <div
                    onClick={() => setEditingField("password")}
                    className={textClass}
                  >
                    {values.password ? "••••••••" : "—"}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="group">
                <span className={fieldLabelClass}>
                  Perfil
                </span>
                {editingField === "role" ? (
                  <select
                    name="role"
                    value={values.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
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
                    <div onClick={() => setEditingField("role")} className={textClass}>
                      <Badge tone={roleBadgeTone}>{ROLE_LABELS[values.role] ?? values.role}</Badge>
                    </div>
                  </>
                )}
              </div>
              {values.role === "agency" && (
                <div className="group">
                  <span className={fieldLabelClass}>
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
                      <div onClick={() => setEditingField("agenciaId")} className={textClass}>
                        {values.agenciaId ? (
                          <Badge>
                            {agencias.find((a) => a.id === values.agenciaId)?.nomeFantasia ?? values.agenciaId}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {values.role !== "agency" && (
                <input type="hidden" name="agenciaId" value="" />
              )}
            </div>

            <div className="group">
              <span className={fieldLabelClass}>
                Acesso
              </span>
              {editingField === "acesso" ? (
                <select
                  name="acesso"
                  value={values.acesso ? "true" : "false"}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      acesso: e.target.value === "true",
                    }))
                  }
                  onBlur={() => setEditingField(null)}
                  autoFocus
                  className={inputClass}
                >
                  <option value="true">Liberado</option>
                  <option value="false">Bloqueado</option>
                </select>
              ) : (
                <>
                  <input
                    type="hidden"
                    name="acesso"
                    value={values.acesso ? "true" : "false"}
                  />
                  <div onClick={() => setEditingField("acesso")} className={textClass}>
                    {values.acesso ? <Badge tone="success">Liberado</Badge> : <Badge tone="danger">Bloqueado</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Modal.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={handleRemover}
            disabled={isPendingSave}
            loading={isPendingRemove}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {isPendingRemove ? (
              "Removendo..."
            ) : (
              <>
                <CircleMinus className="size-3.5 stroke-[2.5]" aria-hidden />
                Remover
              </>
            )}
          </Button>
          <Button type="submit" loading={isPendingSave}>
            {isPendingSave ? (
              "Salvando..."
            ) : (
              <>
                <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                Salvar
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
