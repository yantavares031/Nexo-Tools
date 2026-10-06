"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { BellRing, CalendarClock, Check, Info, Send } from "lucide-react";
import { toast } from "sonner";
import {
  runPendingRemindersNowAction,
  savePendingReminderConfigAction,
} from "@/app/actions/pending-reminders";
import { useConfirm } from "@/components/confirm-provider";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { PendingReminderConfig } from "@/types/globals";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

interface LembretesSectionProps {
  initialConfig: PendingReminderConfig;
}

export function LembretesSection({ initialConfig }: LembretesSectionProps) {
  const [state, formAction, isPendingSave] = useActionState(savePendingReminderConfigAction, null);
  const [isSending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const { confirm } = useConfirm();

  useToastOnActionError(state);

  useEffect(() => {
    if (state?.success) toast.success("Configuração de lembretes salva.");
  }, [state]);

  async function handleSendNow() {
    const ok = await confirm({
      title: "Enviar lembretes agora",
      message:
        "Os e-mails de pendências serão enviados agora para a lista do Sebrae e para as agências com comprovações pendentes. Deseja continuar?",
      confirmLabel: "Enviar agora",
    });
    if (!ok) return;
    startTransition(async () => {
      const response = await runPendingRemindersNowAction();
      if ("error" in response) {
        toast.error(response.error);
        return;
      }
      const { result } = response;
      if (result.skipped) {
        toast.error(result.skipped);
      } else if (result.emailsEnviados === 0 && result.falhas === 0) {
        toast.success("Nenhuma pendência encontrada nos prazos configurados.");
      } else if (result.falhas > 0) {
        toast.error(`${result.emailsEnviados} e-mail(s) enviado(s) e ${result.falhas} falha(s).`);
      } else {
        toast.success(`${result.emailsEnviados} e-mail(s) de lembrete enviado(s).`);
      }
    });
  }

  return (
    <div className="max-w-3xl">
      <form action={formAction}>
        <PanelHeader
          title="Lembretes de pendências"
          description="E-mail diário sobre ordens de compra sem assinatura e demandas sem comprovação."
          actions={
            <Button type="submit" loading={isPendingSave}>
              {!isPendingSave && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
              {isPendingSave ? "Salvando..." : "Salvar"}
            </Button>
          }
        />

        <Callout icon={<Info aria-hidden />} title="Como funciona" className="mb-7">
          Uma vez por dia, a lista de e-mails configurada em Servidor SMTP recebe um resumo das ordens de
          compra em aberto e das demandas Entregue ou Faturado sem comprovação. Cada agência recebe também
          a lista das suas demandas sem comprovação. O envio usa o servidor SMTP, que precisa estar habilitado.
        </Callout>

        <fieldset disabled={isPendingSave}>
          <FormSection icon={<BellRing aria-hidden />} title="Envio automático">
            <div className="space-y-1">
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
                Enviar lembretes diários por e-mail
              </Switch>
              <p className="text-xs text-neutral-500">
                {initialConfig.lastRunAt
                  ? `Última execução: ${formatDateTime(initialConfig.lastRunAt)} — ${initialConfig.lastRunSummary ?? ""}`
                  : "Nenhuma execução registrada ainda."}
              </p>
            </div>
          </FormSection>

          <FormSection
            icon={<CalendarClock aria-hidden />}
            title="Prazos"
            description="A partir de quantos dias a pendência entra no lembrete."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="reminder-oc-days"
                label="Ordem de compra sem assinatura (dias)"
                hint="Contados a partir do envio da OC pela agência."
              >
                <Input
                  id="reminder-oc-days"
                  name="ordemCompraDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={initialConfig.ordemCompraDays}
                  className="tabular-nums"
                />
              </FormField>
              <FormField
                id="reminder-comprovacao-days"
                label="Demanda sem comprovação (dias)"
                hint="Contados a partir da última atualização da demanda."
              >
                <Input
                  id="reminder-comprovacao-days"
                  name="comprovacaoDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={initialConfig.comprovacaoDays}
                  className="tabular-nums"
                />
              </FormField>
            </div>
          </FormSection>
        </fieldset>
      </form>

      <FormSection
        icon={<Send aria-hidden />}
        title="Enviar agora"
        description="Dispara os lembretes imediatamente com os prazos salvos, mesmo com o envio automático desligado."
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleSendNow}
          loading={isSending}
          disabled={isPendingSave}
        >
          {isSending ? "Enviando…" : "Enviar lembretes agora"}
        </Button>
      </FormSection>
    </div>
  );
}
