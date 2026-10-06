"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { Check, Link2, Plus, Power, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { updateWebhookConfigAction, testWebhookAction } from "@/app/actions/webhook-config";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { Switch } from "@/components/ui/switch";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type { WebhookConfig, WebhookEventCode, WebhookContact } from "@/types/globals";

const EVENT_OPTIONS: { value: WebhookEventCode; label: string }[] = [
  { value: "demanda.criada", label: "Demanda criada" },
  { value: "demanda.comprovada", label: "Demanda comprovada" },
];

interface WebhooksFormProps {
  initialConfig: WebhookConfig | null;
}

export function WebhooksForm({ initialConfig }: WebhooksFormProps) {
  const [state, formAction, isPendingSave] = useActionState(updateWebhookConfigAction, null);
  const [isTesting, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [whatsappMod, setWhatsappMod] = useState(initialConfig?.whatsappMod ?? false);
  const [contactList, setContactList] = useState<WebhookContact[]>(initialConfig?.contactList ?? []);

  useToastOnActionError(state);

  const defaultUrl = initialConfig?.url ?? "";
  const defaultEvents = initialConfig?.events ?? [];

  useEffect(() => {
    if (state && !("error" in state) && Object.keys(state).length === 0) {
      toast.success("Configuração de webhook salva.");
    }
  }, [state]);

  function handleTest() {
    const urlInput = document.getElementById("webhook-url") as HTMLInputElement | null;
    const url = urlInput?.value?.trim() ?? "";
    if (!url) {
      toast.error("Informe a URL do webhook para testar.");
      return;
    }
    startTransition(async () => {
      const result = await testWebhookAction(url);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Webhook testado com sucesso.");
      }
    });
  }

  function addContact() {
    setContactList((prev) => [...prev, { phone: "" }]);
  }

  function updateContact(index: number, field: "phone" | "name", value: string) {
    setContactList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeContact(index: number) {
    setContactList((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const events = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[name="event-option"]:checked')
        ).map((el) => el.value) as WebhookEventCode[];
        const hidden = form.querySelector<HTMLInputElement>("#webhook-events-json");
        if (hidden) hidden.value = JSON.stringify(events);
      }}
      className="max-w-3xl"
    >
      <PanelHeader
        title="Webhooks"
        description="URL e eventos que disparam o webhook (método POST). Uma única configuração vale para todo o sistema."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              loading={isTesting}
              disabled={isPendingSave}
            >
              {isTesting ? "Testando..." : "Testar"}
            </Button>
            <Button type="submit" loading={isPendingSave}>
              {!isPendingSave && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
              {isPendingSave ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      />

      <fieldset disabled={isPendingSave}>
        <FormSection icon={<Link2 aria-hidden />} title="Endpoint" description="Endereço que receberá os eventos.">
          <FormField id="webhook-url" label="URL do webhook">
            <Input
              id="webhook-url"
              name="url"
              type="url"
              defaultValue={defaultUrl}
              placeholder="https://exemplo.com/webhook"
            />
          </FormField>
        </FormSection>

        <FormSection icon={<Power aria-hidden />} title="Disparo" description="Liga ou desliga o envio e o modo WhatsApp.">
          <div className="space-y-5">
            <div className="space-y-1">
              <input type="hidden" name="enabled" value={enabled ? "true" : "false"} />
              <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
                Habilitar webhook
              </Switch>
              <p className="text-xs text-neutral-500">Quando desligado, nenhum evento será disparado.</p>
            </div>

            <div className="space-y-1">
              <input type="hidden" name="whatsappMod" value={whatsappMod ? "true" : "false"} />
              <Switch checked={whatsappMod} onChange={(e) => setWhatsappMod(e.target.checked)}>
                Modo WhatsApp
              </Switch>
              <p className="text-xs text-neutral-500">
                Quando ligado, a lista de contatos será enviada como contact_list no body de todo evento.
              </p>
            </div>

            {whatsappMod && (
              <div className="space-y-2">
                <p className="text-[13px] text-neutral-700">Lista de contatos</p>
                {contactList.map((contact, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Telefone"
                      aria-label={`Telefone do contato ${index + 1}`}
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                      className="w-40"
                    />
                    <Input
                      type="text"
                      placeholder="Nome (opcional)"
                      aria-label={`Nome do contato ${index + 1}`}
                      value={contact.name ?? ""}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      className="w-auto min-w-40 flex-1"
                    />
                    <IconButton aria-label="Remover contato" variant="danger" onClick={() => removeContact(index)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <Plus className="size-3.5" aria-hidden />
                  Adicionar contato
                </Button>
                <input type="hidden" name="contactList" value={JSON.stringify(contactList)} />
              </div>
            )}
          </div>
        </FormSection>

        <FormSection icon={<Zap aria-hidden />} title="Eventos" description="Quais eventos disparam o webhook.">
          <div className="space-y-3">
            {EVENT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  name="event-option"
                  value={opt.value}
                  defaultChecked={defaultEvents.includes(opt.value)}
                  className="size-4 rounded border-neutral-300 accent-blue-600"
                />
                <span className="text-sm text-neutral-700">{opt.label}</span>
              </label>
            ))}
          </div>
          <input type="hidden" name="events" id="webhook-events-json" value="" />
        </FormSection>
      </fieldset>
    </form>
  );
}
