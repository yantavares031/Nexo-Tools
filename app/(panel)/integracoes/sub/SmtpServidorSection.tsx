"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { saveSmtpConfigAction, testSmtpEmailAction } from "@/app/actions/smtp-config";
import { toast } from "sonner";
import { Toggle } from "@/components/Toggle";
import { Mail } from "lucide-react";
import type { SmtpConfigPanel } from "@/types/globals";

interface SmtpServidorSectionProps {
  initialPanel: SmtpConfigPanel;
}

export function SmtpServidorSection({ initialPanel }: SmtpServidorSectionProps) {
  const [state, formAction] = useActionState(saveSmtpConfigAction, null);
  const [isTesting, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialPanel.enabled);
  const [testEmail, setTestEmail] = useState("");

  useToastOnActionError(state);

  useEffect(() => {
    if (state && !("error" in state) && Object.keys(state).length === 0) {
      toast.success("Configuração SMTP salva.");
    }
  }, [state]);

  function handleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail.trim()) {
      toast.error("Informe o e-mail de destino do teste.");
      return;
    }
    const fd = new FormData();
    fd.set("testEmail", testEmail.trim());
    startTransition(async () => {
      const result = await testSmtpEmailAction(fd);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("E-mail de teste enviado. Verifique a caixa de entrada.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Mail className="size-5 shrink-0" />
        Servidor SMTP (Gmail)
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Use o mesmo e-mail da conta Google e uma senha de app (não a senha normal da conta), gerada em
        Segurança da conta Google → Verificação em duas etapas → Senhas de app.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="smtp-host" className="mb-1 block text-sm font-medium text-slate-600">
            Servidor SMTP
          </label>
          <input
            id="smtp-host"
            name="smtpHost"
            type="text"
            defaultValue={initialPanel.smtpHost}
            placeholder="smtp.gmail.com"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="smtp-port" className="mb-1 block text-sm font-medium text-slate-600">
            Porta
          </label>
          <input
            id="smtp-port"
            name="smtpPort"
            type="number"
            min={1}
            max={65535}
            defaultValue={initialPanel.smtpPort}
            className="w-full max-w-[140px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <p className="mt-1 text-xs text-slate-500">Gmail: 587 (TLS) ou 465 (SSL).</p>
        </div>

        <div>
          <label htmlFor="smtp-user" className="mb-1 block text-sm font-medium text-slate-600">
            Usuário (e-mail)
          </label>
          <input
            id="smtp-user"
            name="smtpUser"
            type="email"
            autoComplete="username"
            defaultValue={initialPanel.smtpUser}
            placeholder="sua.conta@gmail.com"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="smtp-password" className="mb-1 block text-sm font-medium text-slate-600">
            Senha de app
          </label>
          <input
            id="smtp-password"
            name="smtpPassword"
            type="password"
            autoComplete="new-password"
            placeholder={
              initialPanel.hasPassword ? "Deixe em branco para manter a senha salva" : "Cole a senha de app"
            }
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="space-y-1">
          <Toggle
            name="enabled"
            checked={enabled}
            onChange={setEnabled}
            label="Habilitar envio de e-mail pelo sistema"
          />
          <p className="text-xs text-slate-500">
            Quando ligado, exige usuário e senha válidos. Outros fluxos do sistema poderão usar esta
            configuração.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Enviar e-mail de teste</h3>
        <p className="mb-3 text-xs text-slate-600">
          Usa a configuração já salva no banco (salve antes se alterou usuário ou senha). Em caso de erro,
          detalhes aparecem no terminal do <code className="rounded bg-slate-100 px-1">next dev</code>; para
          ver a senha no log, defina{" "}
          <code className="rounded bg-slate-100 px-1">DEBUG_SMTP_LOG_CREDENTIALS=true</code> no{" "}
          <code className="rounded bg-slate-100 px-1">.env</code> (só em ambiente local).
        </p>
        <form onSubmit={handleTest} className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="smtp-test-email" className="mb-1 block text-xs font-medium text-slate-600">
              Destino
            </label>
            <input
              id="smtp-test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="destino@exemplo.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <button
            type="submit"
            disabled={isTesting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isTesting ? "Enviando…" : "Enviar teste"}
          </button>
        </form>
      </div>
    </div>
  );
}
