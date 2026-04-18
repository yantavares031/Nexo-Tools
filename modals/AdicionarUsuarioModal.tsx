"use client";

import { useState, useActionState, useCallback, useEffect, useRef } from "react";
import { Users, Copy, Check } from "lucide-react";
import { createUserAction, type CreateUserActionState } from "@/app/actions/user";
import { Modal } from "@/components/Modal";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { Agencia } from "@/types/globals";
import { toast } from "sonner";

interface AdicionarUsuarioModalProps {
  open: boolean;
  onClose: () => void;
  /** Chamado ao concluir após exibir a senha temporária (permite resetar o estado do formulário). */
  onCreatedSuccess?: () => void;
  agencias: Agencia[];
}

export function AdicionarUsuarioModal({
  open,
  onClose,
  onCreatedSuccess,
  agencias,
}: AdicionarUsuarioModalProps) {
  const [state, formAction, isPending] = useActionState(createUserAction, null as CreateUserActionState);
  const [acesso, setAcesso] = useState(true);
  const [copied, setCopied] = useState(false);
  const emailFeedbackRef = useRef<string | null>(null);
  useToastOnActionError(state && "error" in state ? state : null);

  useEffect(() => {
    if (!state || !("ok" in state) || !state.ok) {
      emailFeedbackRef.current = null;
      return;
    }
    const key = `${state.userEmail}-${state.emailNotice}-${state.emailError ?? ""}`;
    if (emailFeedbackRef.current === key) return;
    emailFeedbackRef.current = key;

    if (state.emailNotice === "sent") {
      toast.success("E-mail com login e senha temporária enviado.", { id: "create-user-email-notice" });
    } else if (state.emailNotice === "skipped_smtp") {
      toast.message(
        "SMTP não configurado: envie a senha manualmente ou configure em Integrações.",
        { id: "create-user-email-notice" }
      );
    } else if (state.emailNotice === "failed" && state.emailError) {
      toast.error(`Usuário criado, mas o e-mail não foi enviado: ${state.emailError}`, {
        id: "create-user-email-notice",
      });
    }
  }, [state]);

  const handleClose = useCallback(() => {
    setCopied(false);
    onClose();
  }, [onClose]);

  const handleConcluir = useCallback(() => {
    setCopied(false);
    onCreatedSuccess?.();
    onClose();
  }, [onCreatedSuccess, onClose]);

  const copyPassword = useCallback(() => {
    if (state && "ok" in state && state.ok) {
      void navigator.clipboard.writeText(state.temporaryPassword);
      setCopied(true);
      toast.success("Senha copiada para a área de transferência.");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [state]);

  const showSuccess = Boolean(state && "ok" in state && state.ok);

  return (
    <Modal
      open={open}
      onClose={showSuccess ? handleConcluir : handleClose}
      maxWidth="md"
      ariaLabelledby="modal-usuario-title"
      escapeEnabled={showSuccess || !isPending}
      closeOnOverlayClick={showSuccess || !isPending}
    >
      <Modal.Header
        onClose={showSuccess ? handleConcluir : handleClose}
        closeDisabled={!showSuccess && isPending}
      >
        <h2
          id="modal-usuario-title"
          className="flex items-center gap-2 text-lg font-semibold text-slate-800"
        >
          <Users className="size-5 shrink-0" />
          {showSuccess ? "Usuário criado" : "Novo usuário"}
        </h2>
      </Modal.Header>

      {showSuccess && state && "ok" in state && state.ok ? (
        <>
          <Modal.Body>
            {state.emailNotice === "sent" ? (
              <p className="text-sm text-slate-600">
                Enviamos um e-mail para <strong className="break-all">{state.userEmail}</strong> com o{" "}
                <strong>login</strong> e a <strong>senha temporária</strong>. No primeiro acesso será
                solicitada a <strong>alteração da senha</strong>. Abaixo você pode copiar a senha como
                reserva, se precisar.
              </p>
            ) : state.emailNotice === "skipped_smtp" ? (
              <p className="text-sm text-slate-600">
                O envio automático por e-mail não está ativo (configure o SMTP em{" "}
                <strong>Integrações</strong>). Copie a <strong>senha temporária</strong> abaixo e envie por
                um canal seguro. No primeiro login será solicitada a alteração da senha.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Não foi possível enviar o e-mail automaticamente. Copie a <strong>senha temporária</strong>{" "}
                abaixo e envie por um canal seguro para <strong className="break-all">{state.userEmail}</strong>
                . No primeiro login será solicitada a alteração da senha.
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <code className="min-w-0 flex-1 break-all text-sm font-mono text-slate-800">
                {state.temporaryPassword}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="shrink-0 rounded-lg border border-amber-300 bg-white p-2 text-amber-800 transition hover:bg-amber-100"
                title="Copiar senha"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              onClick={handleConcluir}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Concluir
            </button>
          </Modal.Footer>
        </>
      ) : (
        <>
          <Modal.Body as="form" id="adicionar-usuario-form" action={formAction}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-600">
                  E-mail *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                A senha será <strong>gerada automaticamente</strong>. Se o SMTP estiver configurado em{" "}
                <strong>Integrações</strong>, o usuário receberá um e-mail com login e senha temporária; caso
                contrário, a senha será exibida aqui após o cadastro.
              </p>

              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-600">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-600">
                  Perfil *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Admin</option>
                  <option value="agency">Agência</option>
                </select>
              </div>

              <div id="agencia-field">
                <label htmlFor="agenciaId" className="mb-1 block text-sm font-medium text-slate-600">
                  Agência
                </label>
                <select
                  id="agenciaId"
                  name="agenciaId"
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                >
                  <option value="">Selecione (obrigatório para perfil Agência)</option>
                  {agencias.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nomeFantasia}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="hidden" name="acesso" value={acesso ? "true" : "false"} />
                <input
                  id="acesso"
                  type="checkbox"
                  checked={acesso}
                  disabled={isPending}
                  onChange={(e) => setAcesso(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400 disabled:opacity-50"
                />
                <label htmlFor="acesso" className="text-sm font-medium text-slate-600">
                  Acesso liberado
                </label>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <FormActionSubmitButton
              form="adicionar-usuario-form"
              pending={isPending}
              pendingLabel="Adicionando..."
            >
              Adicionar
            </FormActionSubmitButton>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
