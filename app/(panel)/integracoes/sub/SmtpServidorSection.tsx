"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Check, Info, KeyRound, Mail, Power, Send, Server } from "lucide-react";
import { toast } from "sonner";
import { saveSmtpConfigAction, testSmtpEmailAction } from "@/app/actions/smtp-config";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input, inputClassName } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { SmtpConfigPanel } from "@/types/globals";

const codeClassName = "rounded bg-neutral-100 px-1 text-[12px]";

interface SmtpServidorSectionProps {
  initialPanel: SmtpConfigPanel;
}

export function SmtpServidorSection({ initialPanel }: SmtpServidorSectionProps) {
  const [state, formAction, isPendingSave] = useActionState(saveSmtpConfigAction, null);
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
    <div className="max-w-3xl">
      <form action={formAction}>
        <PanelHeader
          title="Servidor SMTP"
          description="Conta Gmail usada para o envio de e-mails pelo sistema."
          actions={
            <Button type="submit" loading={isPendingSave}>
              {!isPendingSave && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
              {isPendingSave ? "Salvando..." : "Salvar"}
            </Button>
          }
        />

        <Callout icon={<Info aria-hidden />} title="Use uma senha de app" className="mb-7">
          Informe o mesmo e-mail da conta Google e uma senha de app (não a senha normal da conta), gerada em
          Segurança da conta Google → Verificação em duas etapas → Senhas de app.
        </Callout>

        <fieldset disabled={isPendingSave}>
          <FormSection icon={<Server aria-hidden />} title="Servidor" description="Endereço e porta do SMTP.">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
              <FormField id="smtp-host" label="Servidor SMTP">
                <Input
                  id="smtp-host"
                  name="smtpHost"
                  type="text"
                  defaultValue={initialPanel.smtpHost}
                  placeholder="smtp.gmail.com"
                />
              </FormField>
              <FormField id="smtp-port" label="Porta" hint="Gmail: 587 (TLS) ou 465 (SSL).">
                <Input
                  id="smtp-port"
                  name="smtpPort"
                  type="number"
                  min={1}
                  max={65535}
                  defaultValue={initialPanel.smtpPort}
                  className="tabular-nums"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={<KeyRound aria-hidden />} title="Autenticação" description="Credenciais da conta de envio.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="smtp-user" label="Usuário (e-mail)">
                <Input
                  id="smtp-user"
                  name="smtpUser"
                  type="email"
                  autoComplete="username"
                  defaultValue={initialPanel.smtpUser}
                  placeholder="sua.conta@gmail.com"
                />
              </FormField>
              <FormField id="smtp-password" label="Senha de app">
                <PasswordInput
                  id="smtp-password"
                  name="smtpPassword"
                  autoComplete="new-password"
                  placeholder={
                    initialPanel.hasPassword ? "Deixe em branco para manter a senha salva" : "Cole a senha de app"
                  }
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection icon={<Power aria-hidden />} title="Envio">
            <div className="space-y-1">
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
                Habilitar envio de e-mail pelo sistema
              </Switch>
              <p className="text-xs text-neutral-500">
                Quando ligado, exige usuário e senha válidos. Outros fluxos do sistema poderão usar esta
                configuração.
              </p>
            </div>
          </FormSection>

          <FormSection
            icon={<Mail aria-hidden />}
            title="Notificações de ordem de compra"
            description="Quem recebe os e-mails quando uma agência envia uma OC."
          >
            <FormField
              id="oc-notify-emails"
              label="E-mails"
              hint="Um endereço por linha (ou separados por vírgula). Recebem aviso quando uma agência envia uma OC e, após a assinatura pelo admin, uma cópia do PDF assinado. O usuário da agência que enviou a OC também recebe e-mails automáticos (cópia de backup)."
            >
              <textarea
                id="oc-notify-emails"
                name="ordemCompraNotifyEmails"
                rows={5}
                defaultValue={initialPanel.ordemCompraNotifyEmailsText}
                placeholder={"financeiro@exemplo.com\ncompras@exemplo.com"}
                className={cn("block h-auto w-full py-2", inputClassName)}
              />
            </FormField>
          </FormSection>
        </fieldset>
      </form>

      <FormSection
        icon={<Send aria-hidden />}
        title="Enviar e-mail de teste"
        description="Usa a configuração já salva no banco (salve antes se alterou usuário ou senha)."
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">
            Em caso de erro, detalhes aparecem no terminal do <code className={codeClassName}>next dev</code>;
            para ver a senha no log, defina <code className={codeClassName}>DEBUG_SMTP_LOG_CREDENTIALS=true</code>{" "}
            no <code className={codeClassName}>.env</code> (só em ambiente local).
          </p>
          <form onSubmit={handleTest} className="flex flex-wrap items-end gap-2">
            <FormField id="smtp-test-email" label="Destino" className="min-w-[200px] flex-1">
              <Input
                id="smtp-test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="destino@exemplo.com"
                disabled={isTesting || isPendingSave}
              />
            </FormField>
            <Button
              type="submit"
              variant="outline"
              className="h-10"
              loading={isTesting}
              disabled={isPendingSave}
            >
              {isTesting ? "Enviando…" : "Enviar teste"}
            </Button>
          </form>
        </div>
      </FormSection>
    </div>
  );
}
