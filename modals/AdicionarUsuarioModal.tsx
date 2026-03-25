"use client";

import { useState, useActionState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { Users, Copy, Check } from "lucide-react";
import { createUserAction, type CreateUserActionState } from "@/app/actions/user";
import { Modal } from "@/components/Modal";
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      form="adicionar-usuario-form"
      disabled={pending}
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Adicionando...
        </>
      ) : (
        "Adicionar"
      )}
    </button>
  );
}

export function AdicionarUsuarioModal({
  open,
  onClose,
  onCreatedSuccess,
  agencias,
}: AdicionarUsuarioModalProps) {
  const [state, formAction] = useActionState(createUserAction, null as CreateUserActionState);
  const [acesso, setAcesso] = useState(true);
  const [copied, setCopied] = useState(false);
  useToastOnActionError(state && "error" in state ? state : null);

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
    >
      <Modal.Header onClose={showSuccess ? handleConcluir : handleClose}>
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
            <p className="text-sm text-slate-600">
              Foi gerada uma <strong>senha temporária</strong>. Ela está salva no banco até o primeiro
              acesso. Envie ao usuário por um canal seguro. No primeiro login ele deverá definir uma nova
              senha.
            </p>
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                A senha será <strong>gerada automaticamente</strong> e exibida após o cadastro.
              </p>

              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-600">
                  Nome
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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
                  onChange={(e) => setAcesso(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
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
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <SubmitButton />
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
